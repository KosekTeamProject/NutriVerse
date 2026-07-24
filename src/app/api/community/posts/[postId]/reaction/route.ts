import { PostReactionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visiblePostWhere } from "@/server/community/post-access";

type RouteContext = { params: Promise<{ postId: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { postId } = await context.params;
    const body = (await request.json().catch(() => null)) as { type?: unknown } | null;
    const type =
      typeof body?.type === "string" && Object.values(PostReactionType).includes(body.type as PostReactionType)
        ? (body.type as PostReactionType)
        : PostReactionType.ENCOURAGE;
    const post = await prisma.post.findFirst({
      where: visiblePostWhere(user.id, postId),
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post tidak ditemukan." },
        { status: 404 },
      );
    }
    const reaction = await prisma.postReaction.upsert({
      where: { postId_userId: { postId, userId: user.id } },
      create: { postId, userId: user.id, type },
      update: { type },
    });
    return NextResponse.json({ success: true, reaction });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { postId } = await context.params;
    await prisma.postReaction.deleteMany({ where: { postId, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
