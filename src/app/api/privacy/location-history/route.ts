import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(
      request,
      "privacy:delete-location",
      3,
      24 * 60 * 60_000,
    );
    const user = await requireCurrentUser();
    const result = await prisma.telemetrySample.deleteMany({
      where: {
        activitySession: {
          is: {
            userId: user.id,
            endTime: { not: null },
          },
        },
      },
    });
    return NextResponse.json({
      success: true,
      deletedSamples: result.count,
      message:
        "Riwayat koordinat GPS telah dihapus. Ringkasan aktivitas dan hasil verifikasi tetap disimpan.",
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
