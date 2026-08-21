import { GuildRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveCommunityMember } from "@/server/community/community-policy";
import { COMMUNITY_MEMBER } from "@/server/community/community-constants";

type RouteContext = { params: Promise<{ communityId: string; postId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { communityId, postId } = await context.params;
    const membership = await requireActiveCommunityMember(communityId, user.id);
    if (membership.role !== GuildRole.OWNER && membership.role !== GuildRole.ADMIN) throw new ApiRequestError("Hanya pengelola yang dapat menyematkan informasi.", 403);
    const body = (await request.json().catch(() => null)) as { isPinned?: unknown } | null;
    if (typeof body?.isPinned !== "boolean") throw new ApiRequestError("Status sematan tidak valid.");
    const post = await prisma.post.findFirst({ where: { id: postId, guildId: communityId }, select: { id: true } });
    if (!post) throw new ApiRequestError("Postingan tidak ditemukan.", 404);
    const updated = await prisma.post.update({ where: { id: post.id }, data: { isPinned: body.isPinned } });
    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { communityId, postId } = await context.params;
    const membership = await prisma.guildMember.findUnique({ where: { guildId_userId: { guildId: communityId, userId: user.id } } });
    if (!membership || membership.status !== COMMUNITY_MEMBER.ACTIVE) throw new ApiRequestError("Keanggotaan aktif diperlukan.", 403);
    const post = await prisma.post.findFirst({ where: { id: postId, guildId: communityId }, select: { id: true, userId: true } });
    if (!post) throw new ApiRequestError("Postingan tidak ditemukan.", 404);
    if (post.userId !== user.id && membership.role !== GuildRole.OWNER && membership.role !== GuildRole.ADMIN) throw new ApiRequestError("Postingan ini tidak dapat dihapus.", 403);
    await prisma.post.update({ where: { id: post.id }, data: { isHidden: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
