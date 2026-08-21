import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ momentId: string; commentId: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { momentId, commentId } = await context.params;
    const comment = await prisma.momentComment.findFirst({
      where: { id: commentId, momentId },
      select: { id: true, userId: true, moment: { select: { userId: true } } },
    });
    if (!comment) return NextResponse.json({ success: false, error: "Komentar tidak ditemukan." }, { status: 404 });
    if (comment.userId !== user.id && comment.moment.userId !== user.id && user.role !== "ADMIN" && user.role !== "MODERATOR") {
      return NextResponse.json({ success: false, error: "Tidak diizinkan menghapus komentar ini." }, { status: 403 });
    }
    await prisma.momentComment.update({ where: { id: comment.id }, data: { isHidden: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
