import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminUser();
    const now = new Date();
    const activityWindowStart = new Date(now.getTime() - 6 * 86_400_000);
    activityWindowStart.setUTCHours(0, 0, 0, 0);
    const [users, activeUsers, verifiedActivities, activitiesPending, reportsPending, appealsPending, activeChallenges, rewardsLowStock, hpBalance, activityRows, recentAudit] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            isSuspended: false,
            OR: [
              { activitySessions: { some: { endTime: { gte: activityWindowStart } } } },
              { nutritionEntries: { some: { loggedAt: { gte: activityWindowStart } } } },
              { waterLogs: { some: { loggedAt: { gte: activityWindowStart } } } },
            ],
          },
        }),
        prisma.activitySession.count({
          where: { verificationStatus: "VERIFIED" },
        }),
        prisma.activitySession.count({
          where: { verificationStatus: { in: ["NEEDS_REVIEW", "MANUAL_REVIEW"] } },
        }),
        prisma.contentReport.count({ where: { status: "PENDING" } }),
        prisma.appeal.count({ where: { status: "PENDING" } }),
        prisma.challenge.count({ where: { isActive: true } }),
        prisma.reward.count({ where: { isActive: true, stock: { lte: 5 } } }),
        prisma.userEconomy.aggregate({ _sum: { currentHp: true } }),
        prisma.activitySession.findMany({
          where: {
            verificationStatus: "VERIFIED",
            endTime: { gte: activityWindowStart, lte: now },
          },
          select: { endTime: true },
        }),
        prisma.auditLog.findMany({
          include: { actorUser: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(activityWindowStart);
      date.setUTCDate(date.getUTCDate() + index);
      return {
        key: date.toISOString().slice(0, 10),
        label: new Intl.DateTimeFormat("id-ID", {
          weekday: "short",
          timeZone: "Asia/Jakarta",
        }).format(date),
        value: 0,
      };
    });
    for (const activity of activityRows) {
      const key = activity.endTime?.toISOString().slice(0, 10);
      const point = days.find((day) => day.key === key);
      if (point) point.value += 1;
    }
    return NextResponse.json({
      success: true,
      counts: {
        users,
        activeUsers,
        verifiedActivities,
        activitiesPending,
        reportsPending,
        appealsPending,
        activeChallenges,
        rewardsLowStock,
        hpInCirculation: hpBalance._sum.currentHp ?? 0,
      },
      activitySeries: days,
      recentAudit,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
