import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  stringValue,
} from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ challengeId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { challengeId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const existing = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { _count: { select: { progresses: true } } },
    });
    if (!existing) {
      throw new ApiRequestError("Challenge tidak ditemukan.", 404);
    }
    const immutableFields = [
      "type",
      "category",
      "trustLevel",
      "metric",
      "activityType",
      "targetValue",
      "targetUnit",
      "bonusXp",
      "bonusHp",
      "startDate",
    ];
    if (
      existing._count.progresses > 0 &&
      immutableFields.some((field) => body?.[field] !== undefined)
    ) {
      throw new ApiRequestError(
        "Aturan dan reward challenge tidak dapat diubah setelah ada peserta.",
        409,
        "CHALLENGE_ALREADY_JOINED",
      );
    }
    const endDate =
      body?.endDate === undefined
        ? undefined
        : typeof body.endDate === "string"
          ? new Date(body.endDate)
          : null;
    if (
      endDate === null ||
      (endDate && Number.isNaN(endDate.getTime())) ||
      (endDate && endDate <= existing.startDate)
    ) {
      throw new ApiRequestError("Tanggal selesai tidak valid.");
    }
    const data = {
      title:
        body?.title === undefined
          ? undefined
          : stringValue(body.title, "Judul", { max: 150 }),
      description:
        body?.description === undefined
          ? undefined
          : stringValue(body.description, "Deskripsi", { max: 2_000 }),
      endDate,
      isActive:
        typeof body?.isActive === "boolean" ? body.isActive : undefined,
    };
    const challenge = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.challenge.update({
        where: { id: challengeId },
        data,
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "UPDATE_CHALLENGE",
          entityName: "Challenge",
          entityId: challengeId,
          beforeState: existing,
          afterState: updated,
          reason:
            body?.reason === undefined
              ? undefined
              : stringValue(body.reason, "Alasan", {
                  min: 3,
                  max: 500,
                }),
        },
      });
      return updated;
    });
    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { challengeId } = await context.params;
    const existing = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!existing) {
      throw new ApiRequestError("Challenge tidak ditemukan.", 404);
    }
    const challenge = await prisma.$transaction(async (transaction) => {
      const archived = await transaction.challenge.update({
        where: { id: challengeId },
        data: { isActive: false },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "ARCHIVE_CHALLENGE",
          entityName: "Challenge",
          entityId: challengeId,
          beforeState: existing,
          afterState: archived,
        },
      });
      return archived;
    });
    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
