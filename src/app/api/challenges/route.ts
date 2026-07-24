import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const history = searchParams.get("history") === "true";
    const challenges = await prisma.challenge.findMany({
      where: history
        ? { progresses: { some: { userId: user.id } } }
        : { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      include: {
        progresses: { where: { userId: user.id }, take: 1 },
        _count: { select: { progresses: true } },
      },
      orderBy: [{ endDate: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ success: true, challenges });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
