import { PrivacyLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ postId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { postId } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const existing = await prisma.post.findFirst({ where: { id: postId, userId: user.id } });
    if (!existing) return NextResponse.json({ success: false, error: "Post tidak ditemukan." }, { status: 404 });
    const privacyLevel =
      typeof body?.privacyLevel === "string" &&
      Object.values(PrivacyLevel).includes(body.privacyLevel as PrivacyLevel)
        ? (body.privacyLevel as PrivacyLevel)
        : undefined;
    const post = await prisma.post.update({
      where: { id: existing.id },
      data: {
        ...(body?.content !== undefined ? { content: stringValue(body.content, "Konten", { max: 2000 }) } : {}),
        ...(privacyLevel ? { privacyLevel } : {}),
      },
    });
    return NextResponse.json({ success: true, post });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { postId } = await context.params;
    const result = await prisma.post.deleteMany({ where: { id: postId, userId: user.id } });
    if (!result.count) return NextResponse.json({ success: false, error: "Post tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
