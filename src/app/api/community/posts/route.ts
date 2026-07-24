import { PrivacyLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedPublicStorageUrl } from "@/lib/storage-ownership";
import { visiblePostWhere } from "@/server/community/post-access";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 50);
    const cursor = searchParams.get("cursor") || undefined;
    const posts = await prisma.post.findMany({
      where: visiblePostWhere(user.id),
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
        guild: { select: { id: true, name: true, emblemUrl: true } },
        comments: {
          where: { isHidden: false },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: "asc" },
          take: 3,
        },
        reactions: true,
        _count: { select: { comments: true, reactions: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = posts.length > limit;
    const page = hasMore ? posts.slice(0, limit) : posts;
    return NextResponse.json({ success: true, posts: page, nextCursor: hasMore ? page.at(-1)?.id : null });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "community:post", 10, 60_000);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const privacyLevel =
      typeof body?.privacyLevel === "string" &&
      Object.values(PrivacyLevel).includes(body.privacyLevel as PrivacyLevel)
        ? (body.privacyLevel as PrivacyLevel)
        : PrivacyLevel.CIRCLE;
    const guildId = typeof body?.guildId === "string" ? body.guildId : undefined;
    if (guildId) {
      const membership = await prisma.guildMember.findUnique({
        where: { guildId_userId: { guildId, userId: user.id } },
      });
      if (!membership) return NextResponse.json({ success: false, error: "Anda bukan anggota guild." }, { status: 403 });
    }
    const imageUrl =
      body?.imageUrl === undefined ||
      body.imageUrl === null ||
      body.imageUrl === ""
        ? null
        : ownedPublicStorageUrl(body.imageUrl, user.authUserId, [
            "post-images",
          ]);
    if (body?.imageUrl && !imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Gambar post harus berasal dari upload pengguna sendiri.",
        },
        { status: 400 },
      );
    }
    const post = await prisma.post.create({
      data: {
        userId: user.id,
        guildId,
        content: stringValue(body?.content, "Konten", { min: 1, max: 2000 }),
        imageUrl,
        privacyLevel,
      },
      include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
    });
    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
