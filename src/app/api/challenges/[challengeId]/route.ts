import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ challengeId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { challengeId } = await context.params;
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        progresses: { where: { userId: user.id }, include: { contributions: true }, take: 1 },
        _count: { select: { progresses: true } },
      },
    });
    if (!challenge) return NextResponse.json({ success: false, error: "Challenge tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
