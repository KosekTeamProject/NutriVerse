import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ activityId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "activity:heartbeat", 12, 60_000);
    const user = await requireCurrentUser();
    const { activityId } = await context.params;
    const heartbeatAt = new Date();
    const refreshed = await prisma.activitySession.updateMany({
      where: {
        id: activityId,
        userId: user.id,
        endTime: null,
      },
      data: { updatedAt: heartbeatAt },
    });
    if (!refreshed.count) {
      return NextResponse.json(
        {
          success: false,
          error: "Aktivitas tidak ditemukan atau sudah selesai.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: true, heartbeatAt });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
