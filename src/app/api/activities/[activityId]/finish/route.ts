import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reconcileActivityFinalization } from "@/server/activity/finalization-service";

type RouteContext = { params: Promise<{ activityId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "activity:finish", 20, 60_000);
    const user = await requireCurrentUser();
    const { activityId } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      endTime?: unknown;
      pausedDurationSeconds?: unknown;
    } | null;
    const session = await prisma.activitySession.findFirst({
      where: { id: activityId, userId: user.id },
    });
    if (!session) return NextResponse.json({ success: false, error: "Aktivitas tidak ditemukan." }, { status: 404 });
    if (!session.endTime) {
      const endTime =
        typeof body?.endTime === "string" ? new Date(body.endTime) : new Date();
      if (
        Number.isNaN(endTime.getTime()) ||
        endTime <= session.startTime ||
        endTime.getTime() > Date.now() + 60_000
      ) {
        return NextResponse.json({ success: false, error: "Waktu selesai tidak valid." }, { status: 400 });
      }
      const wallDurationSeconds = Math.max(
        0,
        Math.round((endTime.getTime() - session.startTime.getTime()) / 1000),
      );
      if (wallDurationSeconds > 86_400) {
        return NextResponse.json(
          { success: false, error: "Durasi aktivitas melebihi batas 24 jam." },
          { status: 400 },
        );
      }
      const pausedDurationSeconds =
        typeof body?.pausedDurationSeconds === "number" &&
        Number.isFinite(body.pausedDurationSeconds)
          ? Math.round(body.pausedDurationSeconds)
          : 0;
      if (pausedDurationSeconds < 0 || pausedDurationSeconds > wallDurationSeconds) {
        return NextResponse.json(
          { success: false, error: "Durasi jeda tidak valid." },
          { status: 400 },
        );
      }
      await prisma.activitySession.update({
        where: { id: session.id },
        data: {
          endTime,
          pausedDurationSeconds,
          activeDurationSeconds: wallDurationSeconds - pausedDurationSeconds,
        },
      });
    }

    const finalized = await reconcileActivityFinalization(session.id);
    return NextResponse.json({ success: true, ...finalized });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
