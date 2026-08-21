import { CmsPublicationStatus, EventApprovalStatus, EventCommentStatus, EventRegistrationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin, enforceRateLimit, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { eventId } = await context.params;
    const event = await prisma.event.findFirst({
      where: { id: eventId, status: CmsPublicationStatus.PUBLISHED, approvalStatus: EventApprovalStatus.APPROVED },
      select: { id: true, createdByUserId: true },
    });
    if (!event) throw new ApiRequestError("Event tidak ditemukan.", 404, "EVENT_NOT_FOUND");
    const comments = await prisma.eventComment.findMany({
      where: { eventId, status: EventCommentStatus.VISIBLE, parentId: null },
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true, role: true, eventRegistrations: { where: { eventId, status: { in: [EventRegistrationStatus.JOINED, EventRegistrationStatus.ATTENDED] } }, select: { id: true } } } },
        replies: { where: { status: EventCommentStatus.VISIBLE }, include: { author: { select: { id: true, name: true, username: true, avatarUrl: true, role: true, eventRegistrations: { where: { eventId, status: { in: [EventRegistrationStatus.JOINED, EventRegistrationStatus.ATTENDED] } }, select: { id: true } } } } }, orderBy: { createdAt: "asc" }, take: 20 },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "asc" }],
      take: 100,
    });
    const present = (comment: (typeof comments)[number] | (typeof comments)[number]["replies"][number]) => {
      const { role, eventRegistrations, ...author } = comment.author;
      return { ...comment, author, roleLabel: ["ADMIN", "MODERATOR"].includes(role) ? "Moderator" : author.id === event.createdByUserId ? "Penyelenggara" : eventRegistrations.length ? "Peserta" : null, isOwner: author.id === user.id };
    };
    return NextResponse.json({ success: true, comments: comments.map((comment) => ({ ...present(comment), replies: comment.replies.map(present) })) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "event:comment", 30, 60_000);
    const user = await requireCurrentUser();
    const { eventId } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const event = await prisma.event.findFirst({ where: { id: eventId, isActive: true, status: CmsPublicationStatus.PUBLISHED, approvalStatus: EventApprovalStatus.APPROVED }, select: { id: true } });
    if (!event) throw new ApiRequestError("Diskusi event tidak tersedia.", 404, "EVENT_NOT_FOUND");
    const parentId = typeof body?.parentId === "string" ? body.parentId : null;
    if (parentId) {
      const parent = await prisma.eventComment.findFirst({ where: { id: parentId, eventId, parentId: null, status: EventCommentStatus.VISIBLE }, select: { id: true } });
      if (!parent) throw new ApiRequestError("Komentar induk tidak ditemukan.");
    }
    const comment = await prisma.eventComment.create({ data: { eventId, authorId: user.id, parentId, content: stringValue(body?.content, "Komentar", { min: 1, max: 500 }) } });
    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
