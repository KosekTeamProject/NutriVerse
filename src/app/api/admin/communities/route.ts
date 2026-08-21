import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminUser();
    const communities = await prisma.guild.findMany({
      select: {
        id: true, name: true, description: true, category: true, rules: true, joinPolicy: true, approvalStatus: true, reviewNote: true, isActive: true, createdAt: true,
        leader: { select: { id: true, name: true, username: true, economy: { select: { currentTier: true } } } },
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ success: true, communities });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
