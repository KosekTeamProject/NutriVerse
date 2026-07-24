import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, enforceRateLimit, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "community:report", 10, 60 * 60_000);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const targets = [body?.postId, body?.commentId, body?.momentId].filter(
      (value) => typeof value === "string" && value,
    );
    if (targets.length !== 1) {
      return NextResponse.json({ success: false, error: "Pilih tepat satu konten untuk dilaporkan." }, { status: 400 });
    }
    const report = await prisma.contentReport.create({
      data: {
        reporterUserId: user.id,
        postId: typeof body?.postId === "string" ? body.postId : undefined,
        commentId: typeof body?.commentId === "string" ? body.commentId : undefined,
        momentId: typeof body?.momentId === "string" ? body.momentId : undefined,
        reason: stringValue(body?.reason, "Alasan", { min: 5, max: 500 }),
      },
    });
    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
