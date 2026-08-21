import { PrivacyLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_APPROVAL, COMMUNITY_MEMBER } from "@/server/community/community-constants";
import { PROFILE_MOMENT_LIMIT } from "@/server/community/profile-moment";

type RouteContext = { params: Promise<{ momentId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const existing = await prisma.moment.findFirst({
      where: { id: momentId, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Moment tidak ditemukan." },
        { status: 404 },
      );
    }
    const privacyLevel = body?.privacyLevel === PrivacyLevel.PUBLIC
      ? PrivacyLevel.PUBLIC
      : body?.privacyLevel === PrivacyLevel.COMMUNITY
        ? PrivacyLevel.COMMUNITY
        : body?.privacyLevel === PrivacyLevel.CIRCLE
          ? PrivacyLevel.CIRCLE
          : body?.privacyLevel === PrivacyLevel.PRIVATE
            ? PrivacyLevel.PRIVATE
            : undefined;
    const communityId = privacyLevel === PrivacyLevel.COMMUNITY && typeof body?.communityId === "string" ? body.communityId : null;
    if (privacyLevel === PrivacyLevel.COMMUNITY) {
      const membership = await prisma.guildMember.findFirst({
        where: { guildId: communityId ?? "", userId: user.id, status: COMMUNITY_MEMBER.ACTIVE, guild: { approvalStatus: COMMUNITY_APPROVAL.APPROVED, isActive: true } },
        select: { id: true },
      });
      if (!membership) return NextResponse.json({ success: false, error: "Pilih komunitas aktif yang kamu ikuti." }, { status: 403 });
    }
    const caption =
      body?.caption === undefined
        ? undefined
        : body.caption === null || body.caption === ""
          ? null
          : stringValue(body.caption, "Caption", { max: 280 });
    const requestedVisibility = typeof body?.visibleOnProfile === "boolean" ? body.visibleOnProfile : undefined;
    const result = await prisma.$transaction(async (transaction) => {
      let visibilityData: { visibleOnProfile?: boolean; profileDisplayOrder?: number | null } = {};
      if (requestedVisibility === true) {
        if (!existing.visibleOnProfile) {
          const visibleCount = await transaction.moment.count({ where: { userId: user.id, visibleOnProfile: true, isHidden: false } });
          if (visibleCount >= PROFILE_MOMENT_LIMIT) {
            throw new ApiRequestError(`Maksimal ${PROFILE_MOMENT_LIMIT} momen dapat ditampilkan di profil.`, 409, "PROFILE_MOMENT_LIMIT_REACHED");
          }
        }
        const order = existing.profileDisplayOrder ?? ((await transaction.moment.aggregate({
          where: { userId: user.id, visibleOnProfile: true },
          _max: { profileDisplayOrder: true },
        }))._max.profileDisplayOrder ?? -1) + 1;
        visibilityData = { visibleOnProfile: true, profileDisplayOrder: order };
      } else if (requestedVisibility === false) {
        visibilityData = { visibleOnProfile: false, profileDisplayOrder: null };
      }

      const moment = await transaction.moment.update({
        where: { id: existing.id },
        data: { caption, privacyLevel, ...visibilityData, ...(privacyLevel ? { communityId: privacyLevel === PrivacyLevel.COMMUNITY ? communityId : null } : {}) },
      });
      const showcaseCount = await transaction.moment.count({ where: { userId: user.id, visibleOnProfile: true, isHidden: false } });
      return { moment, showcaseCount };
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ success: true, ...result, showcaseLimit: PROFILE_MOMENT_LIMIT });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    const result = await prisma.moment.deleteMany({
      where: { id: momentId, userId: user.id },
    });
    if (!result.count) {
      return NextResponse.json(
        { success: false, error: "Moment tidak ditemukan." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
