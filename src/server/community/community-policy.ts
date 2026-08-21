import { Tier } from "@prisma/client";
import { ApiRequestError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_APPROVAL, COMMUNITY_MEMBER } from "@/server/community/community-constants";

export const MAX_OWNED_COMMUNITIES = 3;
export const MAX_ACTIVE_EVENTS = 2;
export const MINIMUM_COMMUNITY_TIER = Tier.SEEDLING;

const TIER_ORDER: readonly Tier[] = [
  Tier.SPROUT,
  Tier.SEEDLING,
  Tier.BLOOM,
  Tier.VITAL,
  Tier.RADIANT,
  Tier.PEAK,
  Tier.ELITE,
  Tier.APEX,
  Tier.LEGEND,
];

export function meetsCommunityTier(currentTier: Tier | null | undefined) {
  return TIER_ORDER.indexOf(currentTier ?? Tier.SPROUT) >= TIER_ORDER.indexOf(MINIMUM_COMMUNITY_TIER);
}

export async function communityCreatorEligibility(userId: string) {
  const [user, used] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true, username: true, economy: { select: { currentTier: true } } } }),
    prisma.guild.count({
      where: {
        leaderId: userId,
        isActive: true,
        approvalStatus: { in: [COMMUNITY_APPROVAL.PENDING_REVIEW, COMMUNITY_APPROVAL.NEEDS_REVISION, COMMUNITY_APPROVAL.APPROVED] },
      },
    }),
  ]);
  if (!user) throw new ApiRequestError("Pengguna tidak ditemukan.", 404);
  const isSystemAdmin = user.role === "ADMIN";
  return {
    used,
    limit: MAX_OWNED_COMMUNITIES,
    currentTier: user.economy?.currentTier ?? Tier.SPROUT,
    minimumTier: MINIMUM_COMMUNITY_TIER,
    eligible: Boolean(user.username) && (isSystemAdmin || meetsCommunityTier(user.economy?.currentTier)) && used < MAX_OWNED_COMMUNITIES,
    usernameReady: Boolean(user.username),
    tierReady: isSystemAdmin || meetsCommunityTier(user.economy?.currentTier),
  };
}

export async function requireActiveCommunityMember(communityId: string, userId: string) {
  const membership = await prisma.guildMember.findUnique({
    where: { guildId_userId: { guildId: communityId, userId } },
    include: { guild: { select: { approvalStatus: true, isActive: true } } },
  });
  if (!membership || membership.status !== COMMUNITY_MEMBER.ACTIVE || !membership.guild.isActive || membership.guild.approvalStatus !== COMMUNITY_APPROVAL.APPROVED) {
    throw new ApiRequestError("Bergabunglah ke komunitas untuk membuka ruang diskusi.", 403, "COMMUNITY_MEMBERSHIP_REQUIRED");
  }
  return membership;
}
