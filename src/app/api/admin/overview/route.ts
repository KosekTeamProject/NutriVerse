import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminUser();
    const [users, activitiesPending, reportsPending, activeChallenges, rewardsLowStock, recentAudit] =
      await Promise.all([
        prisma.user.count(),
        prisma.activitySession.count({
          where: { verificationStatus: { in: ["NEEDS_REVIEW", "MANUAL_REVIEW"] } },
        }),
        prisma.contentReport.count({ where: { status: "PENDING" } }),
        prisma.challenge.count({ where: { isActive: true } }),
        prisma.reward.count({ where: { isActive: true, stock: { lte: 5 } } }),
        prisma.auditLog.findMany({
          include: { actorUser: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);
    return NextResponse.json({
      success: true,
      counts: { users, activitiesPending, reportsPending, activeChallenges, rewardsLowStock },
      recentAudit,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
