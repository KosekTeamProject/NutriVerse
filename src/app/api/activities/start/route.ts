import {
  ActivityProcessingStatus,
  ActivityType,
  VerificationStatus,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  abandonedActivityEndTime,
  activitySessionLeaseExpired,
} from "@/server/activity/session-lifecycle";
import { closeStaleActivitySessions } from "@/server/maintenance/backend-maintenance-service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "activity:start", 20, 60_000);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const activityType =
      typeof body?.activityType === "string" &&
      Object.values(ActivityType).includes(body.activityType as ActivityType)
        ? (body.activityType as ActivityType)
        : null;
    if (!activityType) {
      return NextResponse.json({ success: false, error: "Jenis aktivitas tidak valid." }, { status: 400 });
    }
    const clientSessionId =
      body?.clientSessionId === undefined
        ? undefined
        : stringValue(body.clientSessionId, "Client session ID", { max: 100 });
    const startTime =
      typeof body?.startTime === "string" ? new Date(body.startTime) : new Date();
    if (
      Number.isNaN(startTime.getTime()) ||
      startTime.getTime() > Date.now() + 60_000 ||
      startTime.getTime() < Date.now() - 5 * 60_000
    ) {
      return NextResponse.json({ success: false, error: "Waktu mulai tidak valid." }, { status: 400 });
    }
    await closeStaleActivitySessions(user.id);
    let activeSession = await prisma.activitySession.findFirst({
      where: { userId: user.id, endTime: null },
      orderBy: { startTime: "desc" },
      include: {
        verificationResult: { select: { id: true } },
        telemetrySamples: {
          select: { sequenceNumber: true, segmentNumber: true, timestamp: true },
          orderBy: [{ sequenceNumber: "desc" }, { timestamp: "desc" }],
          take: 1,
        },
      },
    });
    if (
      activeSession &&
      clientSessionId &&
      activeSession.clientSessionId === clientSessionId
    ) {
      const latestSample = activeSession.telemetrySamples[0];
      return NextResponse.json({
        success: true,
        resumed: true,
        session: activeSession,
        resume: {
          nextSequenceNumber:
            (latestSample?.sequenceNumber ?? activeSession.telemetrySampleCount - 1) + 1,
          nextSegmentNumber: (latestSample?.segmentNumber ?? -1) + 1,
          inactiveDurationSeconds: Math.max(
            0,
            Math.floor((Date.now() - activeSession.updatedAt.getTime()) / 1_000),
          ),
        },
      });
    }
    if (activeSession) {
      const sessionToRelease = activeSession;
      const now = new Date();
      if (!activitySessionLeaseExpired({ updatedAt: sessionToRelease.updatedAt, now })) {
        return NextResponse.json(
          {
            success: false,
            error: "Masih ada aktivitas aktif. Selesaikan atau batalkan terlebih dahulu.",
            activeSessionId: sessionToRelease.id,
          },
          { status: 409 },
        );
      }

      const latestSample = sessionToRelease.telemetrySamples[0];
      const endTime = abandonedActivityEndTime({
        startTime: sessionToRelease.startTime,
        updatedAt: sessionToRelease.updatedAt,
        latestTelemetryAt: latestSample?.timestamp,
        now,
      });
      const durationSeconds = Math.max(
        0,
        Math.floor(
          (endTime.getTime() - sessionToRelease.startTime.getTime()) / 1_000,
        ),
      );
      const released = await prisma.$transaction(async (transaction) => {
        if (
          sessionToRelease.telemetrySampleCount === 0 &&
          !sessionToRelease.verificationResult
        ) {
          const deleted = await transaction.activitySession.deleteMany({
            where: {
              id: sessionToRelease.id,
              userId: user.id,
              endTime: null,
              updatedAt: sessionToRelease.updatedAt,
            },
          });
          return deleted.count === 1;
        }
        const closed = await transaction.activitySession.updateMany({
          where: {
            id: sessionToRelease.id,
            userId: user.id,
            endTime: null,
            updatedAt: sessionToRelease.updatedAt,
          },
          data: {
            endTime,
            durationSeconds,
            activeDurationSeconds: durationSeconds,
            verificationStatus: VerificationStatus.NOT_VERIFIED,
            processingStatus: ActivityProcessingStatus.FAILED,
            lastProcessingError:
              "Aktivitas ditutup karena lease browser berakhir sebelum sesi diselesaikan.",
            finalizedAt: now,
          },
        });
        if (closed.count !== 1) return false;
        await transaction.verificationResult.upsert({
          where: { activitySessionId: sessionToRelease.id },
          create: {
            activitySessionId: sessionToRelease.id,
            verificationStatus: VerificationStatus.NOT_VERIFIED,
            reasonCodes: ["SESSION_INTERRUPTED"],
            riskScore: 100,
            sampleCount: sessionToRelease.telemetrySampleCount,
            discardedSampleCount: sessionToRelease.telemetrySampleCount,
          },
          update: {
            verificationStatus: VerificationStatus.NOT_VERIFIED,
            reasonCodes: ["SESSION_INTERRUPTED"],
            riskScore: 100,
            sampleCount: sessionToRelease.telemetrySampleCount,
            acceptedSampleCount: 0,
            discardedSampleCount: sessionToRelease.telemetrySampleCount,
            eligibleXp: 0,
            eligibleHp: 0,
            processedAt: now,
          },
        });
        return true;
      });
      if (!released) {
        activeSession = await prisma.activitySession.findFirst({
          where: { userId: user.id, endTime: null },
          orderBy: { startTime: "desc" },
          include: {
            verificationResult: { select: { id: true } },
            telemetrySamples: {
              select: { sequenceNumber: true, segmentNumber: true, timestamp: true },
              orderBy: [{ sequenceNumber: "desc" }, { timestamp: "desc" }],
              take: 1,
            },
          },
        });
        if (activeSession) {
          return NextResponse.json(
            {
              success: false,
              error: "Aktivitas aktif sedang digunakan pada browser lain.",
              activeSessionId: activeSession.id,
            },
            { status: 409 },
          );
        }
      }
    }
    const existingClientSession = clientSessionId
      ? await prisma.activitySession.findUnique({
          where: {
            userId_clientSessionId: {
              userId: user.id,
              clientSessionId,
            },
          },
          select: { endTime: true },
        })
      : null;
    const effectiveClientSessionId =
      existingClientSession?.endTime || !clientSessionId
        ? crypto.randomUUID()
        : clientSessionId;
    const session = await prisma.activitySession.upsert({
      where: {
        userId_clientSessionId: {
          userId: user.id,
          clientSessionId: effectiveClientSessionId,
        },
      },
      create: {
        userId: user.id,
        clientSessionId: effectiveClientSessionId,
        activityType,
        startTime,
        isSimulated: body?.isSimulated === true,
      },
      update: {},
    });
    return NextResponse.json(
      { success: true, resumed: false, session },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
