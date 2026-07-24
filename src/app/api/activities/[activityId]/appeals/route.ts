import {
  AppealStatus,
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

type RouteContext = { params: Promise<{ activityId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { activityId } = await context.params;
    const appeals = await prisma.appeal.findMany({
      where: { activitySessionId: activityId, userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, appeals });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "activity:appeal", 5, 60 * 60_000);
    const user = await requireCurrentUser();
    const { activityId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const activity = await prisma.activitySession.findFirst({
      where: { id: activityId, userId: user.id },
      select: { id: true, verificationStatus: true },
    });
    if (!activity) {
      return NextResponse.json(
        { success: false, error: "Aktivitas tidak ditemukan." },
        { status: 404 },
      );
    }
    const appealableStatuses: VerificationStatus[] = [
      VerificationStatus.NEEDS_REVIEW,
      VerificationStatus.NOT_VERIFIED,
      VerificationStatus.MANUAL_REVIEW,
    ];
    if (!appealableStatuses.includes(activity.verificationStatus)) {
      return NextResponse.json(
        { success: false, error: "Aktivitas ini tidak memerlukan banding." },
        { status: 409 },
      );
    }
    const pending = await prisma.appeal.findFirst({
      where: {
        activitySessionId: activity.id,
        userId: user.id,
        status: AppealStatus.PENDING,
      },
    });
    if (pending) {
      return NextResponse.json(
        { success: false, error: "Banding aktivitas ini masih diproses." },
        { status: 409 },
      );
    }
    const appeal = await prisma.appeal.create({
      data: {
        activitySessionId: activity.id,
        userId: user.id,
        reason: stringValue(body?.reason, "Alasan banding", {
          min: 10,
          max: 1_000,
        }),
      },
    });
    return NextResponse.json({ success: true, appeal }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
