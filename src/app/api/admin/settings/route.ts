import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireSystemAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULTS = {
  dailyXpCapEnabled: true,
  gpsIntegrityEnabled: true,
  automaticMomentReviewEnabled: true,
} as const;

export async function GET() {
  try {
    await requireSystemAdmin();
    const rows = await prisma.systemSetting.findMany({
      where: { key: { in: Object.keys(DEFAULTS) } },
    });
    const settings = { ...DEFAULTS } as Record<string, boolean>;
    for (const row of rows) {
      if (typeof row.value === "boolean") settings[row.key] = row.value;
    }
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await requireSystemAdmin();
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const entries = Object.keys(DEFAULTS)
      .filter((key) => typeof body?.[key] === "boolean")
      .map((key) => [key, body?.[key] as boolean] as const);
    if (!entries.length) {
      return NextResponse.json(
        { success: false, error: "Tidak ada pengaturan valid." },
        { status: 400 },
      );
    }
    await prisma.$transaction(async (transaction) => {
      for (const [key, value] of entries) {
        await transaction.systemSetting.upsert({
          where: { key },
          create: { key, value, updatedByUserId: admin.id },
          update: { value, updatedByUserId: admin.id },
        });
      }
      await transaction.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "UPDATE_SYSTEM_SETTINGS",
          entityName: "SystemSetting",
          entityId: "global",
          afterState: Object.fromEntries(entries),
        },
      });
    });
    return NextResponse.json({
      success: true,
      settings: Object.fromEntries(entries),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
