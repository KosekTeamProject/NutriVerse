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

type RouteContext = { params: Promise<{ rewardId: string }> };

function datePatch(value: unknown) {
  if (value === null || value === "") return null;
  if (value === undefined) return undefined;
  const parsed = typeof value === "string" ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    throw new ApiRequestError("Tanggal kedaluwarsa tidak valid.");
  }
  return parsed;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { rewardId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const existing = await prisma.reward.findUnique({
      where: { id: rewardId },
    });
    if (!existing) {
      throw new ApiRequestError("Reward tidak ditemukan.", 404);
    }
    const data = {
      title:
        body?.title === undefined
          ? undefined
          : stringValue(body.title, "Judul", { max: 120 }),
      description:
        body?.description === undefined
          ? undefined
          : stringValue(body.description, "Deskripsi", { max: 2_000 }),
      partnerName:
        body?.partnerName === undefined
          ? undefined
          : stringValue(body.partnerName, "Nama mitra", { max: 120 }),
      imageUrl:
        body?.imageUrl === undefined
          ? undefined
          : stringValue(body.imageUrl, "URL gambar", { max: 2_000 }),
      hpCost:
        body?.hpCost === undefined
          ? undefined
          : Math.floor(
              finiteNumber(body.hpCost, "Harga HP", {
                min: 1,
                max: 10_000_000,
              }),
            ),
      stock:
        body?.stock === undefined
          ? undefined
          : Math.floor(
              finiteNumber(body.stock, "Stok", {
                min: 0,
                max: 10_000_000,
              }),
            ),
      expiryDate: datePatch(body?.expiryDate),
      isActive:
        typeof body?.isActive === "boolean" ? body.isActive : undefined,
    };
    const reward = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.reward.update({
        where: { id: existing.id },
        data,
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "UPDATE_REWARD",
          entityName: "Reward",
          entityId: existing.id,
          beforeState: existing,
          afterState: updated,
          reason:
            body?.reason === undefined
              ? undefined
              : stringValue(body.reason, "Alasan", { min: 3, max: 500 }),
        },
      });
      return updated;
    });
    return NextResponse.json({ success: true, reward });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { rewardId } = await context.params;
    const existing = await prisma.reward.findUnique({
      where: { id: rewardId },
    });
    if (!existing) {
      throw new ApiRequestError("Reward tidak ditemukan.", 404);
    }
    const reward = await prisma.$transaction(async (transaction) => {
      const archived = await transaction.reward.update({
        where: { id: rewardId },
        data: { isActive: false },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "ARCHIVE_REWARD",
          entityName: "Reward",
          entityId: rewardId,
          beforeState: existing,
          afterState: archived,
        },
      });
      return archived;
    });
    return NextResponse.json({ success: true, reward });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
