import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ activityId: string }> };
type RawSample = {
  sequenceNumber?: unknown;
  timestamp?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  altitude?: unknown;
  accuracy?: unknown;
  speed?: unknown;
};

function optionalFinite(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
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
      select: { id: true, endTime: true, startTime: true },
    });
    if (!session) return NextResponse.json({ success: false, error: "Aktivitas tidak ditemukan." }, { status: 404 });
    if (session.endTime) return NextResponse.json({ success: false, error: "Aktivitas sudah selesai." }, { status: 409 });

    const samples = body.samples.map((sample, index) => {
      const timestamp = typeof sample.timestamp === "string" || typeof sample.timestamp === "number"
        ? new Date(sample.timestamp)
        : new Date(Number.NaN);
      if (
        Number.isNaN(timestamp.getTime()) ||
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
          typeof sample.sequenceNumber === "number" && Number.isInteger(sample.sequenceNumber)
            ? sample.sequenceNumber
            : null,
        timestamp,
        latitude: sample.latitude,
        longitude: sample.longitude,
        altitude: optionalFinite(sample.altitude),
        accuracy: optionalFinite(sample.accuracy),
        speed: optionalFinite(sample.speed),
      };
    });
    const result = await prisma.telemetrySample.createMany({ data: samples, skipDuplicates: true });
    return NextResponse.json({ success: true, accepted: result.count, received: samples.length });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVALID_TELEMETRY_")) {
      return NextResponse.json({ success: false, error: "Salah satu sampel telemetry tidak valid." }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
