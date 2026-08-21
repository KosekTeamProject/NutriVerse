import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, enforceRateLimit, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visibleMomentWhere } from "@/server/community/moment-access";

type RouteContext = { params: Promise<{ momentId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    const moment = await prisma.moment.findFirst({ where: visibleMomentWhere(user.id, momentId), select: { id: true, userId: true } });
    if (!moment) return NextResponse.json({ success: false, error: "Momen tidak ditemukan." }, { status: 404 });
    const comments = await prisma.momentComment.findMany({
      where: { momentId, isHidden: false },
      select: { id: true, content: true, createdAt: true, userId: true, user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 100,
    });
    return NextResponse.json({ success: true, comments: comments.map((comment) => ({ ...comment, canDelete: comment.userId === user.id || moment.userId === user.id || user.role === "ADMIN" || user.role === "MODERATOR" })), canModerate: moment.userId === user.id }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "moment:comment", 30, 60_000);
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    const moment = await prisma.moment.findFirst({ where: visibleMomentWhere(user.id, momentId), select: { id: true } });
    if (!moment) return NextResponse.json({ success: false, error: "Momen tidak ditemukan." }, { status: 404 });
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const content = stringValue(body?.content, "Komentar", { min: 1, max: 500 });
    const comment = await prisma.momentComment.create({
      data: { momentId, userId: user.id, content },
      select: { id: true, content: true, createdAt: true, userId: true, user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
    });
    return NextResponse.json({ success: true, comment: { ...comment, canDelete: true } }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
