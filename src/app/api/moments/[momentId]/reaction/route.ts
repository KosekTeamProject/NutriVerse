import { PostReactionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visibleMomentWhere } from "@/server/community/moment-access";

type RouteContext = { params: Promise<{ momentId: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const type =
      typeof body?.type === "string" &&
      Object.values(PostReactionType).includes(
        body.type as PostReactionType,
      )
        ? (body.type as PostReactionType)
        : PostReactionType.ENCOURAGE;
    const moment = await prisma.moment.findFirst({
      where: visibleMomentWhere(user.id, momentId),
      select: { id: true },
    });
    if (!moment) {
      return NextResponse.json(
        { success: false, error: "Moment tidak ditemukan." },
        { status: 404 },
      );
    }
    const reaction = await prisma.momentReaction.upsert({
      where: { momentId_userId: { momentId, userId: user.id } },
      create: { momentId, userId: user.id, type },
      update: { type },
    });
    return NextResponse.json({ success: true, reaction });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    await prisma.momentReaction.deleteMany({
      where: { momentId, userId: user.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
