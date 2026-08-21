import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  finiteNumber,
  stringValue,
} from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function dateValue(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  try {
    await requireAdminUser();
    const events = await prisma.event.findMany({
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        reviewedBy: { select: { id: true, name: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { startDate: "desc" },
      take: 200,
    });
    return NextResponse.json({ success: true, events });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const startDate = dateValue(body?.startDate);
    const endDate = dateValue(body?.endDate);
    if (!startDate || !endDate || endDate <= startDate) {
      return NextResponse.json(
        { success: false, error: "Rentang tanggal event tidak valid." },
        { status: 400 },
      );
    }
    const requestedBonusXp = Math.round(
      finiteNumber(body?.bonusXp ?? 0, "Bonus XP", {
        min: 0,
        max: 10_000,
      }),
    );
    const requestedBonusHp = Math.round(
      finiteNumber(body?.bonusHp ?? 0, "Bonus HP", {
        min: 0,
        max: 10_000,
      }),
    );
    if (requestedBonusXp > 0 || requestedBonusHp > 0) {
      throw new ApiRequestError(
        "Bonus event memerlukan aktivitas GPS terverifikasi dan belum boleh diberikan dari kehadiran saja.",
        409,
        "EVENT_REWARD_REQUIRES_VERIFIED_ACTIVITY",
      );
    }
    const event = await prisma.event.create({
      data: {
        title: stringValue(body?.title, "Judul", { min: 3, max: 150 }),
        description: stringValue(body?.description, "Deskripsi", {
          min: 10,
          max: 2_000,
        }),
        bannerUrl: stringValue(body?.bannerUrl, "Banner URL", {
          max: 2_000,
        }),
        location:
          body?.location === undefined || body.location === null
            ? null
            : stringValue(body.location, "Lokasi", { max: 200 }),
        startDate,
        endDate,
        capacity: Math.round(
          finiteNumber(body?.capacity ?? 0, "Kapasitas", {
            min: 0,
            max: 1_000_000,
          }),
        ),
        bonusXp: 0,
        bonusHp: 0,
        createdByUserId: admin.id,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "CREATE_EVENT",
        entityName: "Event",
        entityId: event.id,
        afterState: event,
      },
    });
    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
