import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tierForTotalXp } from "@/server/economy/economy-policy";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const economy =
      (await prisma.userEconomy.findUnique({ where: { userId: user.id } })) ??
      (await prisma.userEconomy.create({ data: { userId: user.id } }));
    const [recentXp, recentHp] = await Promise.all([
      prisma.xPGrant.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.hPLedgerEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    ]);
    return NextResponse.json({
      success: true,
      economy: { ...economy, currentTier: tierForTotalXp(economy.totalXp) },
      transactions: { xp: recentXp, hp: recentHp },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
