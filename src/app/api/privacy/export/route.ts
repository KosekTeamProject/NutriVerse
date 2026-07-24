import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, enforceRateLimit } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(
      request,
      "privacy:export",
      3,
      24 * 60 * 60_000,
    );
    const currentUser = await requireCurrentUser();
    const userId = currentUser.id;
    const [
      account,
      activities,
      xpLedger,
      hpLedger,
      challengeProgress,
      badges,
      redemptions,
      journey,
      journal,
      nutrition,
      water,
      customFoods,
      pulses,
      healthMetrics,
      moments,
      posts,
      comments,
      postReactions,
      momentReactions,
      connections,
      eventRegistrations,
      notifications,
      deviceTokens,
      conversations,
      memories,
      weeklyLetters,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          healthProfile: true,
          companionPreference: true,
          settings: true,
          economy: true,
        },
      }),
      prisma.activitySession.findMany({
        where: { userId },
        include: {
          telemetrySamples: {
            orderBy: [
              { sequenceNumber: "asc" },
              { timestamp: "asc" },
            ],
          },
          verificationResult: true,
          appeals: true,
        },
        orderBy: { startTime: "desc" },
      }),
      prisma.xPGrant.findMany({ where: { userId } }),
      prisma.hPLedgerEntry.findMany({ where: { userId } }),
      prisma.challengeProgress.findMany({ where: { userId } }),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
      }),
      prisma.redemption.findMany({
        where: { userId },
        include: { reward: true },
      }),
      prisma.journeyEntry.findMany({ where: { userId } }),
      prisma.journalEntry.findMany({
        where: { userId },
        include: { attachments: true, reactions: true },
      }),
      prisma.nutritionEntry.findMany({ where: { userId } }),
      prisma.waterLog.findMany({ where: { userId } }),
      prisma.customFoodItem.findMany({ where: { userId } }),
      prisma.healthPulse.findMany({ where: { userId } }),
      prisma.healthMetric.findMany({ where: { userId } }),
      prisma.moment.findMany({ where: { userId } }),
      prisma.post.findMany({ where: { userId } }),
      prisma.postComment.findMany({ where: { userId } }),
      prisma.postReaction.findMany({ where: { userId } }),
      prisma.momentReaction.findMany({ where: { userId } }),
      prisma.userConnection.findMany({
        where: {
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
      }),
      prisma.eventRegistration.findMany({
        where: { userId },
        include: { event: true },
      }),
      prisma.userNotification.findMany({ where: { userId } }),
      prisma.userDeviceToken.findMany({ where: { userId } }),
      prisma.companionConversation.findMany({ where: { userId } }),
      prisma.companionMemory.findMany({ where: { userId } }),
      prisma.weeklyLetterArchive.findMany({ where: { userId } }),
    ]);
    const exportedAt = new Date();
    const payload = {
      exportedAt,
      formatVersion: 1,
      account,
      activities,
      economy: { xpLedger, hpLedger },
      challenges: challengeProgress,
      badges,
      rewards: redemptions,
      journey,
      journal,
      nutrition: { entries: nutrition, water, customFoods },
      health: { pulses, metrics: healthMetrics },
      community: {
        moments,
        posts,
        comments,
        postReactions,
        momentReactions,
        connections,
        eventRegistrations,
      },
      notifications: { notifications, deviceTokens },
      companion: { conversations, memories, weeklyLetters },
    };
    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="nutriverse-export-${exportedAt
          .toISOString()
          .slice(0, 10)}.json"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
