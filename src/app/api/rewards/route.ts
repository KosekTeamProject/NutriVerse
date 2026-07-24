import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const [rewards, economy] = await Promise.all([
      prisma.reward.findMany({
        where: { isActive: true, OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }] },
        orderBy: [{ hpCost: "asc" }, { title: "asc" }],
      }),
      prisma.userEconomy.findUnique({ where: { userId: user.id } }),
    ]);
    return NextResponse.json({ success: true, rewards, currentHp: economy?.currentHp ?? 0 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
