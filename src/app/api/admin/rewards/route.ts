import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  finiteNumber,
  stringValue,
} from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function optionalDate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "string" ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    throw new Error("INVALID_REWARD_EXPIRY");
  }
  return parsed;
}

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const rewards = await prisma.reward.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        _count: { select: { redemptions: true } },
      },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    });
    return NextResponse.json({ success: true, rewards });
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
    const data = {
      title: stringValue(body?.title, "Judul", { max: 120 }),
      description: stringValue(body?.description, "Deskripsi", {
        max: 2_000,
      }),
      partnerName: stringValue(body?.partnerName, "Nama mitra", {
        max: 120,
      }),
      imageUrl: stringValue(body?.imageUrl, "URL gambar", { max: 2_000 }),
      hpCost: Math.floor(
        finiteNumber(body?.hpCost, "Harga HP", { min: 1, max: 10_000_000 }),
      ),
      stock: Math.floor(
        finiteNumber(body?.stock, "Stok", { min: 0, max: 10_000_000 }),
      ),
      expiryDate: optionalDate(body?.expiryDate),
    };
    const reward = await prisma.$transaction(async (transaction) => {
      const created = await transaction.reward.create({ data });
      await transaction.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "CREATE_REWARD",
          entityName: "Reward",
          entityId: created.id,
          afterState: data,
        },
      });
      return created;
    });
    return NextResponse.json({ success: true, reward }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_REWARD_EXPIRY") {
      return NextResponse.json(
        { success: false, error: "Tanggal kedaluwarsa tidak valid." },
        { status: 400 },
      );
    }
    return apiErrorResponse(error);
  }
}
