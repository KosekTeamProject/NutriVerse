import { NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_APPROVAL, COMMUNITY_MEMBER } from "@/server/community/community-constants";

type RouteContext = { params: Promise<{ communityId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { communityId } = await context.params;
    const community = await prisma.guild.findFirst({
      where: { id: communityId, approvalStatus: COMMUNITY_APPROVAL.APPROVED, isActive: true },
      select: {
        id: true, name: true, description: true, emblemUrl: true, category: true, rules: true, joinPolicy: true, approvedAt: true,
        leader: { select: { id: true, name: true, username: true, avatarUrl: true } },
        members: { where: { userId: user.id }, select: { role: true, status: true, visibleOnProfile: true } },
        _count: { select: { members: { where: { status: COMMUNITY_MEMBER.ACTIVE } }, posts: { where: { isHidden: false } } } },
      },
    });
    if (!community) throw new ApiRequestError("Komunitas tidak ditemukan.", 404, "COMMUNITY_NOT_FOUND");
    const fallbackRules = ["Hormati setiap anggota dan hindari perundungan.", "Bagikan informasi yang relevan serta dapat dipertanggungjawabkan.", "Jaga privasi dan jangan menyebarkan data pribadi anggota."];
    return NextResponse.json({ success: true, community: { ...community, rules: community.rules.length > 0 ? community.rules : fallbackRules, membership: community.members[0] ?? null, members: undefined } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
