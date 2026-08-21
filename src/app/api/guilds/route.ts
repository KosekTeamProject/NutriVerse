import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_APPROVAL, COMMUNITY_MEMBER } from "@/server/community/community-constants";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const guilds = await prisma.guild.findMany({
      include: {
        _count: { select: { members: { where: { status: COMMUNITY_MEMBER.ACTIVE } }, posts: true } },
        members: { where: { userId: user.id }, select: { role: true, joinedAt: true } },
      },
      where: { approvalStatus: COMMUNITY_APPROVAL.APPROVED, isActive: true },
      orderBy: [{ members: { _count: "desc" } }, { name: "asc" }],
    });
    return NextResponse.json({ success: true, guilds });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await requireCurrentUser();
    return NextResponse.json({ success: false, error: "Pembuatan langsung dinonaktifkan. Gunakan pengajuan komunitas agar dapat ditinjau Super Admin." }, { status: 410 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
