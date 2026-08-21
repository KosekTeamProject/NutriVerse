import { ConnectionStatus, VerificationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_APPROVAL, COMMUNITY_MEMBER } from "@/server/community/community-constants";
import { signedMomentImages } from "@/server/community/moment-images";
import { visibleMomentWhere } from "@/server/community/moment-access";
import { PROFILE_MOMENT_LIMIT } from "@/server/community/profile-moment";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const currentUser = await requireCurrentUser();
    const { userId } = await context.params;
    const isOwnProfile = userId === currentUser.id;
    const connection = isOwnProfile
      ? null
      : await prisma.userConnection.findFirst({
          where: {
            OR: [
              { requesterId: currentUser.id, addresseeId: userId },
              { requesterId: userId, addresseeId: currentUser.id },
            ],
          },
          select: { requesterId: true, status: true },
        });
    if (connection?.status === ConnectionStatus.BLOCKED) {
      return NextResponse.json({ success: false, error: "Profil pengguna tidak ditemukan." }, { status: 404 });
    }
    const relationship = isOwnProfile
      ? "self"
      : connection?.status === ConnectionStatus.ACCEPTED
        ? "friends"
        : connection?.status === ConnectionStatus.PENDING
          ? connection.requesterId === currentUser.id ? "outgoing" : "incoming"
          : "none";
    const canViewDetails = relationship === "self" || relationship === "friends";
    const [profile, activity, visibleCommunities, visibleMoments] = await Promise.all([
      prisma.user.findFirst({
        where: { id: userId, isSuspended: false },
        select: {
          id: true,
          name: true,
          username: true,
          bio: true,
          avatarUrl: true,
          createdAt: true,
          economy: { select: { totalXp: true, currentTier: true, streakDays: true } },
          badges: {
            select: {
              earnedAt: true,
              badge: { select: { id: true, code: true, name: true, description: true, iconUrl: true } },
            },
            orderBy: { earnedAt: "desc" },
          },
        },
      }),
      prisma.activitySession.aggregate({
        where: { userId, verificationStatus: VerificationStatus.VERIFIED },
        _count: { id: true },
        _sum: { distanceMeters: true },
      }),
      prisma.guildMember.findMany({
        where: {
          userId,
          status: COMMUNITY_MEMBER.ACTIVE,
          visibleOnProfile: true,
          guild: { approvalStatus: COMMUNITY_APPROVAL.APPROVED, isActive: true },
        },
        select: {
          role: true,
          guild: {
            select: {
              id: true,
              name: true,
              category: true,
              emblemUrl: true,
              _count: { select: { members: { where: { status: COMMUNITY_MEMBER.ACTIVE } } } },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      }),
      prisma.moment.findMany({
        where: {
          AND: [
            visibleMomentWhere(currentUser.id),
            { userId, visibleOnProfile: true },
          ],
        },
        select: {
          id: true,
          imageUrl: true,
          caption: true,
          privacyLevel: true,
          duringActivity: true,
          createdAt: true,
          profileDisplayOrder: true,
          community: { select: { id: true, name: true } },
        },
        orderBy: [{ profileDisplayOrder: "asc" }, { createdAt: "desc" }],
        take: PROFILE_MOMENT_LIMIT,
      }),
    ]);
    if (!profile) {
      return NextResponse.json({ success: false, error: "Profil teman tidak ditemukan." }, { status: 404 });
    }
    const signedVisibleMoments = await signedMomentImages(visibleMoments);
    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        economy: canViewDetails ? profile.economy : null,
        badges: canViewDetails ? profile.badges : [],
        guildMemberships: canViewDetails ? visibleCommunities : [],
        profileMoments: signedVisibleMoments,
        stats: canViewDetails ? {
          verifiedActivityCount: activity._count.id,
          totalDistanceKm: Math.round(((activity._sum.distanceMeters ?? 0) / 1_000) * 100) / 100,
        } : { verifiedActivityCount: 0, totalDistanceKm: 0 },
        relationship,
        canViewDetails,
      },
    }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
