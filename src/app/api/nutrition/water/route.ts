import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, finiteNumber } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshDailyHealthPulse } from "@/server/health/health-pulse-service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const volumeMl = finiteNumber(body?.volumeMl, "Volume air", { min: 1, max: 5000 });
    const log = await prisma.waterLog.create({
      data: { userId: user.id, volumeMl: Math.round(volumeMl) },
    });
    const healthPulse = await refreshDailyHealthPulse({
      userId: user.id,
      occurredAt: log.loggedAt,
    });
    return NextResponse.json(
      { success: true, log, healthPulse: healthPulse.pulse },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
