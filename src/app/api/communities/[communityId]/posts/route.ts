import { PostKind, PrivacyLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, enforceRateLimit, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveCommunityMember } from "@/server/community/community-policy";

type RouteContext = { params: Promise<{ communityId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { communityId } = await context.params;
    await requireActiveCommunityMember(communityId, user.id);
    const posts = await prisma.post.findMany({
      where: { guildId: communityId, isHidden: false },
      select: {
        id: true, content: true, isPinned: true, createdAt: true, userId: true,
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
        comments: {
          where: { isHidden: false },
          select: { id: true, content: true, createdAt: true, userId: true, user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
          orderBy: { createdAt: "asc" },
          take: 100,
        },
        _count: { select: { reactions: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 50,
    });
    return NextResponse.json({ success: true, posts: posts.map((post) => ({ ...post, isOwner: post.userId === user.id })) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "community:post", 20, 60 * 60_000);
    const user = await requireCurrentUser();
    const { communityId } = await context.params;
    await requireActiveCommunityMember(communityId, user.id);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const post = await prisma.post.create({
      data: { userId: user.id, guildId: communityId, content: stringValue(body?.content, "Informasi", { min: 2, max: 1_500 }), privacyLevel: PrivacyLevel.PRIVATE, kind: PostKind.REFLECTION },
    });
    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
