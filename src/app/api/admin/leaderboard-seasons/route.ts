import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  stringValue,
} from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SEASON_DURATION_DAYS, SEASON_TIMEZONE } from "@/server/leaderboard/season-policy";

function requiredDate(value: unknown, field: string) {
  const date = typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw new ApiRequestError(`${field} tidak valid.`);
  }
  return date;
}

export async function GET() {
  try {
    await requireAdminUser();
    const seasons = await prisma.leaderboardSeason.findMany({
      include: { _count: { select: { rankings: true } } },
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json({ success: true, seasons });
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
    const startDate = requiredDate(body?.startDate, "Tanggal mulai");
    const endDate = requiredDate(body?.endDate, "Tanggal selesai");
    if (endDate <= startDate) {
      throw new ApiRequestError(
        "Tanggal selesai harus setelah tanggal mulai.",
      );
    }
    const durationDays = (endDate.getTime() - startDate.getTime()) / 86_400_000;
    if (Math.abs(durationDays - SEASON_DURATION_DAYS) > 0.001) {
      throw new ApiRequestError(`Durasi season harus ${SEASON_DURATION_DAYS} hari untuk semua pengguna.`);
    }
    const isActive =
      typeof body?.isActive === "boolean" ? body.isActive : true;
    if (isActive) {
      const overlapping = await prisma.leaderboardSeason.findFirst({
        where: {
          isActive: true,
          startDate: { lt: endDate },
          endDate: { gt: startDate },
        },
        select: { id: true },
      });
      if (overlapping) {
        throw new ApiRequestError(
          "Rentang season bertabrakan dengan season aktif.",
          409,
          "SEASON_OVERLAP",
        );
      }
    }
    const season = await prisma.$transaction(async (transaction) => {
      const created = await transaction.leaderboardSeason.create({
        data: {
          name: stringValue(body?.name, "Nama season", { max: 150 }),
          startDate,
          endDate,
          isActive,
          timezone: SEASON_TIMEZONE,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "CREATE_LEADERBOARD_SEASON",
          entityName: "LeaderboardSeason",
          entityId: created.id,
          afterState: created,
        },
      });
      return created;
    });
    return NextResponse.json({ success: true, season }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
