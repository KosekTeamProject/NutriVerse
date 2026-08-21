import { GuildRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_MEMBER } from "@/server/community/community-constants";

type RouteContext = { params: Promise<{ communityId: string }> };

async function requireManager(communityId: string, userId: string) {
  const membership = await prisma.guildMember.findUnique({ where: { guildId_userId: { guildId: communityId, userId } } });
  if (!membership || membership.status !== COMMUNITY_MEMBER.ACTIVE || (membership.role !== GuildRole.OWNER && membership.role !== GuildRole.ADMIN)) {
    throw new ApiRequestError("Hanya pengelola komunitas yang dapat mengatur anggota.", 403);
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { communityId } = await context.params;
    await requireManager(communityId, user.id);
    const members = await prisma.guildMember.findMany({
      where: { guildId: communityId },
      select: { id: true, role: true, status: true, joinedAt: true, user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      orderBy: [{ status: "asc" }, { joinedAt: "asc" }],
    });
    return NextResponse.json({ success: true, members });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { communityId } = await context.params;
    await requireManager(communityId, user.id);
    const body = (await request.json().catch(() => null)) as { membershipId?: unknown; action?: unknown } | null;
    if (typeof body?.membershipId !== "string") throw new ApiRequestError("Keanggotaan tidak valid.");
    const membership = await prisma.guildMember.findFirst({ where: { id: body.membershipId, guildId: communityId } });
    if (!membership || membership.role === GuildRole.OWNER) throw new ApiRequestError("Keanggotaan tidak dapat diubah.", 409);
    const status = body.action === "approve" ? COMMUNITY_MEMBER.ACTIVE : body.action === "reject" ? COMMUNITY_MEMBER.REJECTED : null;
    if (!status) throw new ApiRequestError("Aksi anggota tidak valid.");
    const updated = await prisma.guildMember.update({ where: { id: membership.id }, data: { status, approvedAt: status === COMMUNITY_MEMBER.ACTIVE ? new Date() : null } });
    return NextResponse.json({ success: true, membership: updated });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
