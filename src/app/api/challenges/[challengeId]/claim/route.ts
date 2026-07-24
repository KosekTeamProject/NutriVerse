import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateAndAwardUserBadges } from "@/server/badges/badge-service";
import { claimChallengeReward } from "@/server/challenges/challenge-service";

type RouteContext = { params: Promise<{ challengeId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { challengeId } = await context.params;
    const progress = await prisma.challengeProgress.findUnique({
      where: { userId_challengeId: { userId: user.id, challengeId } },
    });
    if (!progress) return NextResponse.json({ success: false, error: "Anda belum mengikuti challenge ini." }, { status: 404 });
    const reward = await claimChallengeReward(progress.id);
    const badges = await evaluateAndAwardUserBadges(user.id);
    return NextResponse.json({ success: true, reward, badges });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
