import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, enforceRateLimit, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visiblePostWhere } from "@/server/community/post-access";

type RouteContext = { params: Promise<{ postId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "community:comment", 30, 60_000);
    const user = await requireCurrentUser();
    const { postId } = await context.params;
    const body = (await request.json().catch(() => null)) as { content?: unknown } | null;
    const post = await prisma.post.findFirst({
      where: visiblePostWhere(user.id, postId),
      select: { id: true },
    });
    if (!post) return NextResponse.json({ success: false, error: "Post tidak ditemukan." }, { status: 404 });
    const comment = await prisma.postComment.create({
      data: {
        postId,
        userId: user.id,
        content: stringValue(body?.content, "Komentar", { min: 1, max: 500 }),
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
