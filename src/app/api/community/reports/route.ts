import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, enforceRateLimit, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visibleMomentWhere } from "@/server/community/moment-access";
import { visiblePostWhere } from "@/server/community/post-access";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "community:report", 10, 60 * 60_000);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const targets = [body?.postId, body?.commentId, body?.momentId].filter(
      (value) => typeof value === "string" && value,
    );
    if (targets.length !== 1) {
      return NextResponse.json({ success: false, error: "Pilih tepat satu konten untuk dilaporkan." }, { status: 400 });
    }
    const postId = typeof body?.postId === "string" ? body.postId : undefined;
    const commentId =
      typeof body?.commentId === "string" ? body.commentId : undefined;
    const momentId =
      typeof body?.momentId === "string" ? body.momentId : undefined;
    const [post, comment, moment] = await Promise.all([
      postId
        ? prisma.post.findFirst({
            where: visiblePostWhere(user.id, postId),
            select: { id: true, userId: true },
          })
        : null,
      commentId
        ? prisma.postComment.findFirst({
            where: {
              id: commentId,
              isHidden: false,
              post: { is: visiblePostWhere(user.id) },
            },
            select: { id: true, userId: true },
          })
        : null,
      momentId
        ? prisma.moment.findFirst({
            where: visibleMomentWhere(user.id, momentId),
            select: { id: true, userId: true },
          })
        : null,
    ]);
    const target = post ?? comment ?? moment;
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Konten tidak ditemukan." },
        { status: 404 },
      );
    }
    if (target.userId === user.id) {
      return NextResponse.json(
        { success: false, error: "Konten sendiri tidak dapat dilaporkan." },
        { status: 409 },
      );
    }
    const report = await prisma.$transaction(async (transaction) => {
      const created = await transaction.contentReport.create({
        data: {
          reporterUserId: user.id,
          postId,
          commentId,
          momentId,
          reason: stringValue(body?.reason, "Alasan", {
            min: 5,
            max: 500,
          }),
        },
      });
      if (momentId) {
        await transaction.moment.update({
          where: { id: momentId },
          data: { reportCount: { increment: 1 } },
        });
      }
      return created;
    });
    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
