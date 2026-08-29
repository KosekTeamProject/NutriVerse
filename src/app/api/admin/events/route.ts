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
import { validateEventRewardConfig } from "@/server/events/event-reward-policy";

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
    let rewardConfig;
    try {
      rewardConfig = validateEventRewardConfig({
        participationHp: finiteNumber(body?.participationHp ?? 25, "HP partisipasi"),
        firstPlaceBonusHp: finiteNumber(body?.firstPlaceBonusHp ?? 150, "Bonus HP juara 1"),
        secondPlaceBonusHp: finiteNumber(body?.secondPlaceBonusHp ?? 100, "Bonus HP juara 2"),
        thirdPlaceBonusHp: finiteNumber(body?.thirdPlaceBonusHp ?? 75, "Bonus HP juara 3"),
      });
    } catch {
      throw new ApiRequestError("Reward harus berurutan juara 1 > 2 > 3 dan berada dalam batas yang ditentukan.", 400, "EVENT_REWARD_INVALID");
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
        ...rewardConfig,
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
