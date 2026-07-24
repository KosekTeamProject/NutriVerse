import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ challengeId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { challengeId } = await context.params;
    const now = new Date();
    const challenge = await prisma.challenge.findFirst({
      where: { id: challengeId, isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    });
    if (!challenge) return NextResponse.json({ success: false, error: "Challenge tidak aktif." }, { status: 404 });
    const progress = await prisma.challengeProgress.upsert({
      where: { userId_challengeId: { userId: user.id, challengeId } },
      create: { userId: user.id, challengeId },
      update: {},
    });
    return NextResponse.json({ success: true, progress }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
