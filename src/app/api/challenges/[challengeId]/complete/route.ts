import { NextRequest, NextResponse } from "next/server";
import {
  ChallengeTrustLevel,
  Prisma,
} from "@prisma/client";
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

    const progress = await prisma.$transaction(
      async (transaction) => {
        const challenge = await transaction.challenge.findFirst({
          where: {
            id: challengeId,
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
          },
        });
        if (!challenge) throw new Error("CHALLENGE_NOT_ACTIVE");
        if (challenge.trustLevel !== ChallengeTrustLevel.HABIT_SELF_REPORT) {
          throw new Error("CHALLENGE_REQUIRES_VERIFIED_ACTIVITY");
        }
        return transaction.challengeProgress.upsert({
          where: {
            userId_challengeId: { userId: user.id, challengeId },
          },
          create: {
            userId: user.id,
            challengeId,
            currentValue: challenge.targetValue,
            isCompleted: true,
            completedAt: now,
          },
          update: {
            currentValue: challenge.targetValue,
            isCompleted: true,
            completedAt: now,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
    return NextResponse.json({ success: true, progress });
  } catch (error) {
    if (error instanceof Error && error.message === "CHALLENGE_NOT_ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Challenge tidak aktif." },
        { status: 404 },
      );
    }
    if (
      error instanceof Error &&
      error.message === "CHALLENGE_REQUIRES_VERIFIED_ACTIVITY"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Challenge ini hanya dapat diselesaikan oleh aktivitas GPS terverifikasi.",
        },
        { status: 409 },
      );
    }
    return apiErrorResponse(error);
  }
}
