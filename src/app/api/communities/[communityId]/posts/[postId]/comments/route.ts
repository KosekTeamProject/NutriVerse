import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin, enforceRateLimit, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveCommunityMember } from "@/server/community/community-policy";

type RouteContext = { params: Promise<{ communityId: string; postId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "community:comment", 40, 60 * 60_000);
    const user = await requireCurrentUser();
    const { communityId, postId } = await context.params;
    await requireActiveCommunityMember(communityId, user.id);
    const post = await prisma.post.findFirst({ where: { id: postId, guildId: communityId, isHidden: false }, select: { id: true } });
    if (!post) throw new ApiRequestError("Postingan tidak ditemukan.", 404);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const comment = await prisma.postComment.create({ data: { postId: post.id, userId: user.id, content: stringValue(body?.content, "Komentar", { min: 1, max: 500 }) } });
    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
