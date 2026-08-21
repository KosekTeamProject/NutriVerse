import { ConnectionStatus, Prisma, PrivacyLevel, ShareTemplateStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, enforceRateLimit, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedStoragePath } from "@/lib/storage-ownership";
import { COMMUNITY_APPROVAL, COMMUNITY_MEMBER } from "@/server/community/community-constants";
import { signedMomentImages } from "@/server/community/moment-images";
import { PROFILE_MOMENT_LIMIT } from "@/server/community/profile-moment";

type FeedScope = "public" | "community" | "friends" | "mine" | "showcase";

function feedScope(value: string | null): FeedScope {
  if (value === "community" || value === "friends" || value === "mine" || value === "showcase") return value;
  return "public";
}

async function connectedUserIds(userId: string) {
  const connections = await prisma.userConnection.findMany({
    where: { status: ConnectionStatus.ACCEPTED, OR: [{ requesterId: userId }, { addresseeId: userId }] },
    select: { requesterId: true, addresseeId: true },
  });
  return connections.map((connection) => connection.requesterId === userId ? connection.addresseeId : connection.requesterId);
}

function discoveryJitter(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4_294_967_295;
}

function diversifyCreators<T extends { userId: string }>(items: T[]) {
  const remaining = [...items];
  const result: T[] = [];
  while (remaining.length) {
    const previousCreator = result.at(-1)?.userId;
    const nextIndex = remaining.findIndex((item) => item.userId !== previousCreator);
    const [nextItem] = remaining.splice(nextIndex >= 0 ? nextIndex : 0, 1);
    if (nextItem) result.push(nextItem);
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const scope = feedScope(request.nextUrl.searchParams.get("scope"));
    const communityId = request.nextUrl.searchParams.get("communityId") || undefined;
    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit")) || 10, 1), 30);
    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
    const publicOffset = scope === "public" && cursor ? Math.max(Number.parseInt(cursor, 10) || 0, 0) : 0;

    let where: Prisma.MomentWhereInput = { isHidden: false, user: { isSuspended: false } };
    if (scope === "showcase") {
      where = { ...where, userId: user.id, visibleOnProfile: true };
    } else if (scope === "mine") {
      where = { ...where, userId: user.id };
    } else if (scope === "friends") {
      const friendIds = await connectedUserIds(user.id);
      where = {
        ...where,
        privacyLevel: PrivacyLevel.CIRCLE,
        userId: { in: [...new Set([user.id, ...friendIds])] },
      };
    } else if (scope === "community") {
      where = {
        ...where,
        privacyLevel: PrivacyLevel.COMMUNITY,
        community: {
          approvalStatus: COMMUNITY_APPROVAL.APPROVED,
          isActive: true,
          ...(communityId ? { id: communityId } : {}),
          members: { some: { userId: user.id, status: COMMUNITY_MEMBER.ACTIVE } },
        },
      };
    } else {
      where = { ...where, privacyLevel: PrivacyLevel.PUBLIC };
    }

    const rows = await prisma.moment.findMany({
      where,
      select: {
        id: true,
        userId: true,
        imageUrl: true,
        caption: true,
        duringActivity: true,
        privacyLevel: true,
        visibleOnProfile: true,
        profileDisplayOrder: true,
        reportCount: true,
        createdAt: true,
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
        activitySession: {
          select: {
            id: true,
            activityType: true,
            startTime: true,
            distanceMeters: true,
            durationSeconds: true,
            verificationStatus: true,
          },
        },
        community: { select: { id: true, name: true, emblemUrl: true } },
        shareTemplate: { select: { id: true, name: true, version: true } },
        reactions: { where: { userId: user.id }, select: { id: true } },
        _count: { select: { reactions: true, comments: { where: { isHidden: false } } } },
      },
      orderBy: scope === "showcase"
        ? [{ profileDisplayOrder: "asc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }, { id: "desc" }],
      take: scope === "showcase" ? PROFILE_MOMENT_LIMIT : limit + 1,
      ...(scope === "public"
        ? { skip: publicOffset }
        : scope !== "showcase" && cursor
          ? { cursor: { id: cursor }, skip: 1 }
          : {}),
    });

    const preferredActivityTypes = new Set<string>();
    if (scope === "public") {
      const [ownActivities, reactedActivities] = await Promise.all([
        prisma.activitySession.findMany({
          where: { userId: user.id },
          orderBy: { startTime: "desc" },
          take: 20,
          select: { activityType: true },
        }),
        prisma.momentReaction.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { moment: { select: { activitySession: { select: { activityType: true } } } } },
        }),
      ]);
      ownActivities.forEach((activity) => preferredActivityTypes.add(activity.activityType));
      reactedActivities.forEach((reaction) => {
        const activityType = reaction.moment.activitySession?.activityType;
        if (activityType) preferredActivityTypes.add(activityType);
      });
    }

    const hasMore = scope !== "showcase" && rows.length > limit;
    const candidates = hasMore ? rows.slice(0, limit) : rows;
    const page = scope === "public"
      ? diversifyCreators([...candidates].sort((left, right) => {
          const score = (moment: (typeof rows)[number]) => {
            const ageHours = Math.max(0, (Date.now() - moment.createdAt.getTime()) / 3_600_000);
            const freshness = Math.max(0, 72 - ageHours) * 0.7;
            const engagement = Math.log1p(moment._count.reactions * 2 + moment._count.comments * 3) * 9;
            const activityMatch = moment.activitySession && preferredActivityTypes.has(moment.activitySession.activityType) ? 16 : 0;
            const exploration = discoveryJitter(`${user.id}:${moment.id}`) * 14;
            const creatorBalance = moment.userId === user.id ? -10 : 0;
            const reportPenalty = moment.reportCount * 8;
            return freshness + engagement + activityMatch + exploration + creatorBalance - reportPenalty;
          };
          return score(right) - score(left) || right.createdAt.getTime() - left.createdAt.getTime();
        }))
      : candidates;
    const signedPage = await signedMomentImages(page);
    const authorIds = [...new Set(page.map((moment) => moment.userId).filter((id) => id !== user.id))];
    const connections = authorIds.length ? await prisma.userConnection.findMany({
      where: {
        OR: [
          { requesterId: user.id, addresseeId: { in: authorIds } },
          { addresseeId: user.id, requesterId: { in: authorIds } },
        ],
      },
      select: { id: true, requesterId: true, addresseeId: true, status: true },
    }) : [];
    const connectionByUser = new Map(connections.map((connection) => [
      connection.requesterId === user.id ? connection.addresseeId : connection.requesterId,
      connection,
    ]));

    const showcaseCount = scope === "mine"
      ? await prisma.moment.count({ where: { userId: user.id, visibleOnProfile: true, isHidden: false } })
      : undefined;

    return NextResponse.json({
      success: true,
      moments: signedPage.map((moment) => {
        const connection = connectionByUser.get(moment.userId);
        const connectionState = moment.userId === user.id
          ? "SELF"
          : connection?.status === ConnectionStatus.ACCEPTED
            ? "FRIEND"
            : connection?.status === ConnectionStatus.PENDING
              ? connection.requesterId === user.id ? "PENDING_SENT" : "PENDING_RECEIVED"
              : "NONE";
        return {
          ...moment,
          reportCount: undefined,
          isOwner: moment.userId === user.id,
          likedByMe: moment.reactions.length > 0,
          reactions: undefined,
          connection: { id: connection?.id ?? null, state: connectionState },
        };
      }),
      nextCursor: hasMore
        ? scope === "public"
          ? String(publicOffset + page.length)
          : page.at(-1)?.id ?? null
        : null,
      meta: { scope, communityId: communityId ?? null, ranking: scope === "public" ? "fyp-v1" : "recent", showcaseCount, showcaseLimit: PROFILE_MOMENT_LIMIT },
    }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "moment:create", 10, 60_000);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const imagePath = ownedStoragePath(body?.imagePath, user.authUserId);
    if (!imagePath) {
      return NextResponse.json({ success: false, error: "Foto Momen harus berasal dari upload privat pengguna sendiri." }, { status: 400 });
    }

    const privacyLevel = body?.privacyLevel === PrivacyLevel.PUBLIC
      ? PrivacyLevel.PUBLIC
      : body?.privacyLevel === PrivacyLevel.COMMUNITY
        ? PrivacyLevel.COMMUNITY
        : body?.privacyLevel === PrivacyLevel.CIRCLE
          ? PrivacyLevel.CIRCLE
          : PrivacyLevel.PRIVATE;
    const communityId = typeof body?.communityId === "string" && body.communityId ? body.communityId : null;
    if (privacyLevel === PrivacyLevel.COMMUNITY) {
      if (!communityId) return NextResponse.json({ success: false, error: "Pilih komunitas tujuan." }, { status: 400 });
      const membership = await prisma.guildMember.findFirst({
        where: {
          guildId: communityId,
          userId: user.id,
          status: COMMUNITY_MEMBER.ACTIVE,
          guild: { approvalStatus: COMMUNITY_APPROVAL.APPROVED, isActive: true },
        },
        select: { id: true },
      });
      if (!membership) return NextResponse.json({ success: false, error: "Kamu bukan anggota aktif komunitas tersebut." }, { status: 403 });
    }

    const activitySessionId = typeof body?.activitySessionId === "string" ? body.activitySessionId : null;
    const activity = activitySessionId ? await prisma.activitySession.findFirst({
      where: { id: activitySessionId, userId: user.id },
      select: { id: true, activityType: true, startTime: true, distanceMeters: true, durationSeconds: true, caloriesBurned: true, verificationStatus: true },
    }) : null;
    if (activitySessionId && !activity) return NextResponse.json({ success: false, error: "Aktivitas tidak ditemukan." }, { status: 404 });

    const shareTemplateId = typeof body?.shareTemplateId === "string" ? body.shareTemplateId : null;
    const shareTemplate = shareTemplateId ? await prisma.shareTemplate.findFirst({
      where: { id: shareTemplateId, status: ShareTemplateStatus.PUBLISHED },
      select: { id: true, version: true },
    }) : null;
    if (shareTemplateId && !shareTemplate) return NextResponse.json({ success: false, error: "Template berbagi tidak tersedia." }, { status: 404 });

    const [economy, pulseHistory] = shareTemplate ? await Promise.all([
      prisma.userEconomy.findUnique({ where: { userId: user.id }, select: { totalXp: true, currentTier: true, streakDays: true } }),
      prisma.healthPulse.findMany({ where: { userId: user.id }, orderBy: { pulseDate: "desc" }, take: 2, select: { overallScore: true, pulseDate: true } }),
    ]) : [null, []];
    const currentPulse = pulseHistory[0]?.overallScore ?? null;
    const previousPulse = pulseHistory[1]?.overallScore ?? null;
    const pulseDelta = currentPulse !== null && previousPulse !== null ? Math.round((currentPulse - previousPulse) * 10) / 10 : null;
    const metricsSnapshot = shareTemplate ? {
      activity,
      progress: economy,
      healthPulse: {
        currentScore: currentPulse,
        previousScore: previousPulse,
        deltaPoints: pulseDelta,
        trend: pulseDelta === null ? "UNKNOWN" : pulseDelta > 0 ? "UP" : pulseDelta < 0 ? "DOWN" : "STABLE",
        comparisonLabel: pulseHistory[1] ? `dibanding ${pulseHistory[1].pulseDate.toISOString().slice(0, 10)}` : null,
      },
    } : undefined;

    const caption = body?.caption === undefined || body.caption === null ? null : stringValue(body.caption, "Caption", { max: 280 });
    const moment = await prisma.moment.create({
      data: {
        userId: user.id,
        activitySessionId: activity?.id ?? null,
        communityId: privacyLevel === PrivacyLevel.COMMUNITY ? communityId : null,
        shareTemplateId: shareTemplate?.id ?? null,
        shareTemplateVersion: shareTemplate?.version ?? null,
        metricsSnapshot,
        imageUrl: imagePath,
        caption,
        duringActivity: body?.duringActivity === true || Boolean(activity),
        privacyLevel,
      },
      include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } }, community: { select: { id: true, name: true } } },
    });
    const [signed] = await signedMomentImages([moment]);
    return NextResponse.json({ success: true, moment: signed }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
