import {
  ActivityType,
  ChallengeCategory,
  ChallengeMetric,
  ChallengeTrustLevel,
  ChallengeType,
} from "@prisma/client";
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

function enumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  field: string,
) {
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw new ApiRequestError(`${field} tidak valid.`);
  }
  return value as T;
}

function requiredDate(value: unknown, field: string) {
  const date = typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw new ApiRequestError(`${field} tidak valid.`);
  }
  return date;
}

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const challenges = await prisma.challenge.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: { _count: { select: { progresses: true } } },
      orderBy: { createdAt: "desc" },
      take: 250,
    });
    return NextResponse.json({ success: true, challenges });
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
    const trustLevel = enumValue(
      body?.trustLevel ?? ChallengeTrustLevel.GPS_VERIFIED_ONLY,
      Object.values(ChallengeTrustLevel),
      "Trust level",
    );
    const bonusXp = Math.floor(
      finiteNumber(body?.bonusXp ?? 0, "Bonus XP", {
        min: 0,
        max: 100_000,
      }),
    );
    const bonusHp = Math.floor(
      finiteNumber(body?.bonusHp ?? 0, "Bonus HP", {
        min: 0,
        max: 100_000,
      }),
    );
    if (
      trustLevel === ChallengeTrustLevel.HABIT_SELF_REPORT &&
      (bonusXp > 0 || bonusHp > 0)
    ) {
      throw new ApiRequestError(
        "Challenge self-report tidak boleh memberi XP/HP kompetitif.",
        409,
        "SELF_REPORT_REWARD_FORBIDDEN",
      );
    }
    const startDate = requiredDate(body?.startDate, "Tanggal mulai");
    const endDate = requiredDate(body?.endDate, "Tanggal selesai");
    if (endDate <= startDate) {
      throw new ApiRequestError(
        "Tanggal selesai harus setelah tanggal mulai.",
      );
    }
    const activityType =
      body?.activityType === undefined || body.activityType === null
        ? null
        : enumValue(
            body.activityType,
            Object.values(ActivityType),
            "Jenis aktivitas",
          );
    const data = {
      title: stringValue(body?.title, "Judul", { max: 150 }),
      description: stringValue(body?.description, "Deskripsi", {
        max: 2_000,
      }),
      type: enumValue(
        body?.type,
        Object.values(ChallengeType),
        "Tipe challenge",
      ),
      category: enumValue(
        body?.category ?? ChallengeCategory.CARDIO,
        Object.values(ChallengeCategory),
        "Kategori",
      ),
      trustLevel,
      metric: enumValue(
        body?.metric ?? ChallengeMetric.DISTANCE_METERS,
        Object.values(ChallengeMetric),
        "Metrik",
      ),
      activityType,
      targetValue: finiteNumber(body?.targetValue, "Target", {
        min: 0.0001,
        max: 100_000_000,
      }),
      targetUnit: stringValue(body?.targetUnit, "Satuan target", {
        max: 30,
      }),
      bonusXp,
      bonusHp,
      startDate,
      endDate,
    };
    const challenge = await prisma.$transaction(async (transaction) => {
      const created = await transaction.challenge.create({ data });
      await transaction.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "CREATE_CHALLENGE",
          entityName: "Challenge",
          entityId: created.id,
          afterState: created,
        },
      });
      return created;
    });
    return NextResponse.json(
      { success: true, challenge },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
