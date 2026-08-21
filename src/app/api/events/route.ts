import { CmsPublicationStatus, EventApprovalStatus, EventRegistrationStatus, type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { discoveryParams, stableDiscoveryOffset } from "@/server/community/discovery";

const eventSelect = (userId: string) => ({
  id: true,
  title: true,
  description: true,
  bannerUrl: true,
  startDate: true,
  endDate: true,
  location: true,
  capacity: true,
  createdBy: { select: { id: true, name: true, username: true } },
  registrations: {
    where: { userId },
    select: { id: true, status: true, joinedAt: true, attendedAt: true },
  },
  _count: {
    select: {
      registrations: { where: { status: { in: [EventRegistrationStatus.JOINED, EventRegistrationStatus.ATTENDED] } } },
    },
  },
}) satisfies Prisma.EventSelect;

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const { query, cursor, limit, rotation } = discoveryParams(request.nextUrl);
    const scope = request.nextUrl.searchParams.get("scope");
    const includePast = request.nextUrl.searchParams.get("includePast") === "true";
    const availableWhere: Prisma.EventWhereInput = {
      isActive: true,
      status: CmsPublicationStatus.PUBLISHED,
      approvalStatus: EventApprovalStatus.APPROVED,
      ...(includePast ? {} : { endDate: { gte: new Date() } }),
    };

    if (scope === "joined") {
      const rows = await prisma.event.findMany({
        where: { ...availableWhere, registrations: { some: { userId: user.id, status: { in: [EventRegistrationStatus.JOINED, EventRegistrationStatus.ATTENDED] } } } },
        select: eventSelect(user.id),
        orderBy: { startDate: "asc" },
        take: 50,
      });
      return NextResponse.json({ success: true, events: rows, meta: { mode: "joined", hasMore: false } });
    }

    if (scope === "featured") {
      const featuredWhere: Prisma.EventWhereInput = { ...availableWhere, startDate: { gte: new Date() } };
      const total = await prisma.event.count({ where: featuredWhere });
      const offset = stableDiscoveryOffset(total, user.id, "featured-events", rotation);
      const take = Math.min(limit, total);
      const first = await prisma.event.findMany({ where: featuredWhere, select: eventSelect(user.id), orderBy: { id: "asc" }, skip: offset, take });
      const missing = take - first.length;
      const wrapped = missing > 0 ? await prisma.event.findMany({ where: featuredWhere, select: eventSelect(user.id), orderBy: { id: "asc" }, take: missing }) : [];
      return NextResponse.json({ success: true, events: [...first, ...wrapped], meta: { mode: "featured", total, hasMore: total > limit } });
    }

    if (query) {
      const where: Prisma.EventWhereInput = {
        ...availableWhere,
        ...(cursor ? { id: { gt: cursor } } : {}),
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { location: { contains: query, mode: "insensitive" } },
          { createdBy: { is: { OR: [{ name: { contains: query, mode: "insensitive" } }, { username: { contains: query, mode: "insensitive" } }] } } },
        ],
      };
      const rows = await prisma.event.findMany({ where, select: eventSelect(user.id), orderBy: { id: "asc" }, take: limit + 1 });
      const hasMore = rows.length > limit;
      const events = rows.slice(0, limit);
      return NextResponse.json({ success: true, events, meta: { mode: "search", query, hasMore, nextCursor: hasMore ? events.at(-1)?.id ?? null : null } });
    }

    const total = await prisma.event.count({ where: availableWhere });
    const offset = stableDiscoveryOffset(total, user.id, "events", rotation);
    const first = await prisma.event.findMany({ where: availableWhere, select: eventSelect(user.id), orderBy: { id: "asc" }, skip: offset, take: Math.min(limit, total) });
    const missing = Math.min(limit, total) - first.length;
    const wrapped = missing > 0 ? await prisma.event.findMany({ where: availableWhere, select: eventSelect(user.id), orderBy: { id: "asc" }, take: missing }) : [];
    return NextResponse.json({ success: true, events: [...first, ...wrapped], meta: { mode: "recommendation", total, hasMore: total > limit, rotation } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
