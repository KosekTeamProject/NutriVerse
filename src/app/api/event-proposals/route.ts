import { CmsPublicationStatus, EventApprovalStatus, ExternalLinkStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin, enforceRateLimit, finiteNumber, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_ACTIVE_EVENTS } from "@/server/community/community-policy";

function dateValue(value: unknown) {
  if (typeof value !== "string") return null;
  const result = new Date(value);
  return Number.isNaN(result.getTime()) ? null : result;
}

function whatsappInvite(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const raw = stringValue(value, "Link grup WhatsApp", { max: 500 });
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ApiRequestError("Link grup WhatsApp tidak valid.");
  }
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "chat.whatsapp.com" || url.pathname.split("/").filter(Boolean).length !== 1) {
    throw new ApiRequestError("Gunakan link undangan grup resmi https://chat.whatsapp.com/…");
  }
  return url.toString();
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const [proposals, activeCount] = await Promise.all([
      prisma.event.findMany({
        where: { createdByUserId: user.id },
        select: {
          id: true, title: true, startDate: true, endDate: true, location: true, approvalStatus: true,
          reviewNote: true, whatsappLinkStatus: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.event.count({
        where: {
          createdByUserId: user.id,
          OR: [
            { approvalStatus: { in: [EventApprovalStatus.PENDING_REVIEW, EventApprovalStatus.NEEDS_REVISION] } },
            { approvalStatus: EventApprovalStatus.APPROVED, endDate: { gt: new Date() } },
          ],
        },
      }),
    ]);
    return NextResponse.json({ success: true, proposals, quota: { used: activeCount, limit: MAX_ACTIVE_EVENTS } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "event:proposal", 5, 24 * 60 * 60_000);
    const user = await requireCurrentUser();
    if (!user.username) throw new ApiRequestError("Atur username sebelum mengajukan event.", 409, "USERNAME_REQUIRED");
    const activeCount = await prisma.event.count({
      where: {
        createdByUserId: user.id,
        OR: [
          { approvalStatus: { in: [EventApprovalStatus.PENDING_REVIEW, EventApprovalStatus.NEEDS_REVISION] } },
          { approvalStatus: EventApprovalStatus.APPROVED, endDate: { gt: new Date() } },
        ],
      },
    });
    if (activeCount >= MAX_ACTIVE_EVENTS) throw new ApiRequestError(`Batas ${MAX_ACTIVE_EVENTS} event aktif sudah tercapai. Event yang selesai akan otomatis membebaskan kuota.`, 409, "EVENT_LIMIT_REACHED");
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const startDate = dateValue(body?.startDate);
    const endDate = dateValue(body?.endDate);
    if (!startDate || !endDate || startDate <= new Date() || endDate <= startDate) {
      throw new ApiRequestError("Tanggal event harus berada di masa depan dan memiliki rentang yang valid.");
    }
    const inviteUrl = whatsappInvite(body?.whatsappInviteUrl);
    const event = await prisma.event.create({
      data: {
        title: stringValue(body?.title, "Judul", { min: 3, max: 150 }),
        description: stringValue(body?.description, "Deskripsi", { min: 20, max: 2_000 }),
        bannerUrl: typeof body?.bannerUrl === "string" && body.bannerUrl.trim()
          ? stringValue(body.bannerUrl, "Banner URL", { max: 2_000 })
          : "/brand/nutriverse-app-icon-200.png",
        location: stringValue(body?.location, "Lokasi", { min: 3, max: 200 }),
        startDate,
        endDate,
        capacity: Math.round(finiteNumber(body?.capacity ?? 0, "Kapasitas", { min: 1, max: 100_000 })),
        isActive: false,
        status: CmsPublicationStatus.REVIEW,
        approvalStatus: EventApprovalStatus.PENDING_REVIEW,
        createdByUserId: user.id,
        whatsappInviteUrl: inviteUrl,
        whatsappLinkStatus: inviteUrl ? ExternalLinkStatus.PENDING_REVIEW : ExternalLinkStatus.NONE,
      },
    });
    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
