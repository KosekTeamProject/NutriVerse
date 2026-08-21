import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_APPROVAL, COMMUNITY_JOIN, COMMUNITY_MEMBER } from "@/server/community/community-constants";

type RouteContext = { params: Promise<{ guildId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { guildId } = await context.params;
    const guild = await prisma.guild.findFirst({ where: { id: guildId, approvalStatus: COMMUNITY_APPROVAL.APPROVED, isActive: true }, select: { id: true, joinPolicy: true } });
    if (!guild) return NextResponse.json({ success: false, error: "Guild tidak ditemukan." }, { status: 404 });
    const current = await prisma.guildMember.findUnique({ where: { guildId_userId: { guildId, userId: user.id } } });
    if (current?.status === COMMUNITY_MEMBER.BANNED) throw new ApiRequestError("Akun tidak dapat bergabung ke komunitas ini.", 403);
    const status = guild.joinPolicy === COMMUNITY_JOIN.OPEN ? COMMUNITY_MEMBER.ACTIVE : COMMUNITY_MEMBER.PENDING;
    const membership = await prisma.guildMember.upsert({
      where: { guildId_userId: { guildId, userId: user.id } },
      create: { guildId, userId: user.id, status, approvedAt: status === COMMUNITY_MEMBER.ACTIVE ? new Date() : null },
      update: { status, approvedAt: status === COMMUNITY_MEMBER.ACTIVE ? new Date() : null },
    });
    return NextResponse.json({ success: true, membership }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { guildId } = await context.params;
    const membership = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId, userId: user.id } },
    });
    if (!membership) return NextResponse.json({ success: false, error: "Keanggotaan tidak ditemukan." }, { status: 404 });
    if (membership.role === "OWNER") {
      return NextResponse.json({ success: false, error: "Owner harus memindahkan kepemilikan sebelum keluar." }, { status: 409 });
    }
    await prisma.guildMember.delete({ where: { id: membership.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
