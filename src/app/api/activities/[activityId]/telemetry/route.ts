import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ activityId: string }> };
type RawSample = {
  sequenceNumber?: unknown;
  segmentNumber?: unknown;
  timestamp?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  altitude?: unknown;
  accuracy?: unknown;
  speed?: unknown;
};

const MAX_TOTAL_SAMPLES_PER_ACTIVITY = 50_000;

function optionalFinite(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "activity:telemetry", 120, 60_000);
    const user = await requireCurrentUser();
    const { activityId } = await context.params;
    const body = (await request.json().catch(() => null)) as { samples?: RawSample[] } | null;
    if (!Array.isArray(body?.samples) || body.samples.length < 1 || body.samples.length > 500) {
      return NextResponse.json(
        { success: false, error: "Telemetry harus berisi 1-500 sampel." },
        { status: 400 },
      );
    }
    const session = await prisma.activitySession.findFirst({
      where: { id: activityId, userId: user.id },
      select: {
        id: true,
        endTime: true,
        startTime: true,
        telemetrySampleCount: true,
      },
    });
    if (!session) return NextResponse.json({ success: false, error: "Aktivitas tidak ditemukan." }, { status: 404 });
    if (session.endTime) return NextResponse.json({ success: false, error: "Aktivitas sudah selesai." }, { status: 409 });
    if (
      session.telemetrySampleCount + body.samples.length >
      MAX_TOTAL_SAMPLES_PER_ACTIVITY
    ) {
      return NextResponse.json(
        { success: false, error: "Jumlah telemetry aktivitas melebihi batas." },
        { status: 413 },
      );
    }

    const samples = body.samples.map((sample, index) => {
      const timestamp = typeof sample.timestamp === "string" || typeof sample.timestamp === "number"
        ? new Date(sample.timestamp)
        : new Date(Number.NaN);
      if (
        Number.isNaN(timestamp.getTime()) ||
        timestamp.getTime() < session.startTime.getTime() - 60_000 ||
        timestamp.getTime() > Date.now() + 60_000 ||
        typeof sample.latitude !== "number" ||
        !Number.isFinite(sample.latitude) ||
        sample.latitude < -90 ||
        sample.latitude > 90 ||
        typeof sample.longitude !== "number" ||
        !Number.isFinite(sample.longitude) ||
        sample.longitude < -180 ||
        sample.longitude > 180
      ) {
        throw new Error(`INVALID_TELEMETRY_${index}`);
      }
      return {
        activitySessionId: session.id,
        sequenceNumber:
          typeof sample.sequenceNumber === "number" &&
          Number.isInteger(sample.sequenceNumber) &&
          sample.sequenceNumber >= 0 &&
          sample.sequenceNumber <= 1_000_000
            ? sample.sequenceNumber
            : null,
        segmentNumber:
          typeof sample.segmentNumber === "number" &&
          Number.isInteger(sample.segmentNumber) &&
          sample.segmentNumber >= 0 &&
          sample.segmentNumber <= 10_000
            ? sample.segmentNumber
            : 0,
        timestamp,
        latitude: sample.latitude,
        longitude: sample.longitude,
        altitude: optionalFinite(sample.altitude),
        accuracy: optionalFinite(sample.accuracy),
        speed: optionalFinite(sample.speed),
      };
    });
    for (const [index, sample] of samples.entries()) {
      if (
        (sample.altitude !== null &&
          (sample.altitude < -500 || sample.altitude > 10_000)) ||
        (sample.accuracy !== null &&
          (sample.accuracy < 0 || sample.accuracy > 10_000)) ||
        (sample.speed !== null &&
          (sample.speed < 0 || sample.speed > 150))
      ) {
        throw new Error(`INVALID_TELEMETRY_${index}`);
      }
    }
    let result: { count: number } | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        result = await prisma.$transaction(
          async (transaction) => {
            const reservation =
              await transaction.activitySession.updateMany({
                where: {
                  id: session.id,
                  userId: user.id,
                  endTime: null,
                  telemetrySampleCount: {
                    lte:
                      MAX_TOTAL_SAMPLES_PER_ACTIVITY -
                      samples.length,
                  },
                },
                data: {
                  telemetrySampleCount: {
                    increment: samples.length,
                  },
                },
              });
            if (!reservation.count) {
              throw new Error("TELEMETRY_RESERVATION_REJECTED");
            }
            const inserted = await transaction.telemetrySample.createMany({
              data: samples,
              skipDuplicates: true,
            });
            const duplicates = samples.length - inserted.count;
            if (duplicates > 0) {
              await transaction.activitySession.update({
                where: { id: session.id },
                data: {
                  telemetrySampleCount: {
                    decrement: duplicates,
                  },
                },
              });
            }
            return inserted;
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 10_000,
            timeout: 20_000,
          },
        );
        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034" &&
          attempt < 2
        ) {
          continue;
        }
        throw error;
      }
    }
    if (!result) throw new Error("TELEMETRY_RETRY_EXHAUSTED");
    return NextResponse.json({ success: true, accepted: result.count, received: samples.length });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVALID_TELEMETRY_")) {
      return NextResponse.json({ success: false, error: "Salah satu sampel telemetry tidak valid." }, { status: 400 });
    }
    if (
      error instanceof Error &&
      error.message === "TELEMETRY_RESERVATION_REJECTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Aktivitas sudah selesai atau jumlah telemetry melebihi batas.",
        },
        { status: 409 },
      );
    }
    return apiErrorResponse(error);
  }
}
