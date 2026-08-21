import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_APPROVAL, COMMUNITY_MEMBER } from "@/server/community/community-constants";
import { discoveryParams, stableDiscoveryOffset } from "@/server/community/discovery";

const communitySelect = (userId: string) => ({
  id: true,
  name: true,
  description: true,
  emblemUrl: true,
  category: true,
  joinPolicy: true,
  leader: { select: { id: true, name: true, username: true } },
  members: { where: { userId }, select: { role: true, status: true, visibleOnProfile: true } },
  _count: {
    select: {
      members: { where: { status: COMMUNITY_MEMBER.ACTIVE } },
      posts: { where: { isHidden: false } },
    },
  },
}) satisfies Prisma.GuildSelect;

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const scope = request.nextUrl.searchParams.get("scope");
    const { query, cursor, limit, rotation } = discoveryParams(request.nextUrl);
    const approvedWhere = { approvalStatus: COMMUNITY_APPROVAL.APPROVED, isActive: true } as const;

    if (scope === "mine") {
      const communities = await prisma.guild.findMany({
        where: { ...approvedWhere, members: { some: { userId: user.id, status: COMMUNITY_MEMBER.ACTIVE } } },
        select: communitySelect(user.id),
        orderBy: { name: "asc" },
        take: 100,
      });
      return NextResponse.json({ success: true, communities, meta: { mode: "mine", hasMore: false } });
    }

    if (scope === "featured") {
      const discoveryWhere: Prisma.GuildWhereInput = {
        ...approvedWhere,
        NOT: { members: { some: { userId: user.id, status: COMMUNITY_MEMBER.ACTIVE } } },
      };
      const discoveryTotal = await prisma.guild.count({ where: discoveryWhere });
      const offset = stableDiscoveryOffset(discoveryTotal, user.id, "featured-communities", rotation);
      const take = Math.min(limit, discoveryTotal);
      const first = await prisma.guild.findMany({ where: discoveryWhere, select: communitySelect(user.id), orderBy: { id: "asc" }, skip: offset, take });
      const missingAfterFirst = take - first.length;
      const wrapped = missingAfterFirst > 0 ? await prisma.guild.findMany({ where: discoveryWhere, select: communitySelect(user.id), orderBy: { id: "asc" }, take: missingAfterFirst }) : [];
      const recommended = [...first, ...wrapped];
      const remaining = limit - recommended.length;
      const fallback = remaining > 0 ? await prisma.guild.findMany({
        where: { ...approvedWhere, id: { notIn: recommended.map((community) => community.id) } },
        select: communitySelect(user.id),
        orderBy: { id: "asc" },
        take: remaining,
      }) : [];
      return NextResponse.json({ success: true, communities: [...recommended, ...fallback], meta: { mode: "featured", hasMore: discoveryTotal > limit } });
    }

    if (query) {
      const where: Prisma.GuildWhereInput = {
        ...approvedWhere,
        ...(cursor ? { id: { gt: cursor } } : {}),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      };
      const rows = await prisma.guild.findMany({ where, select: communitySelect(user.id), orderBy: { id: "asc" }, take: limit + 1 });
      const hasMore = rows.length > limit;
      const communities = rows.slice(0, limit);
      return NextResponse.json({ success: true, communities, meta: { mode: "search", query, hasMore, nextCursor: hasMore ? communities.at(-1)?.id ?? null : null } });
    }

    const total = await prisma.guild.count({ where: approvedWhere });
    const offset = stableDiscoveryOffset(total, user.id, "communities", rotation);
    const first = await prisma.guild.findMany({ where: approvedWhere, select: communitySelect(user.id), orderBy: { id: "asc" }, skip: offset, take: Math.min(limit, total) });
    const missing = Math.min(limit, total) - first.length;
    const wrapped = missing > 0 ? await prisma.guild.findMany({ where: approvedWhere, select: communitySelect(user.id), orderBy: { id: "asc" }, take: missing }) : [];
    return NextResponse.json({ success: true, communities: [...first, ...wrapped], meta: { mode: "recommendation", total, hasMore: total > limit, rotation } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
