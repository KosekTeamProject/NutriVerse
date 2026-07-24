import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  stringValue,
} from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ seasonId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { seasonId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const existing = await prisma.leaderboardSeason.findUnique({
      where: { id: seasonId },
    });
    if (!existing) {
      throw new ApiRequestError("Season tidak ditemukan.", 404);
    }
    const isActive =
      typeof body?.isActive === "boolean" ? body.isActive : undefined;
    const name =
      body?.name === undefined
        ? undefined
        : stringValue(body.name, "Nama season", { max: 150 });
    if (isActive === true) {
      const overlapping = await prisma.leaderboardSeason.findFirst({
        where: {
          id: { not: seasonId },
          isActive: true,
          startDate: { lt: existing.endDate },
          endDate: { gt: existing.startDate },
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
      const updated = await transaction.leaderboardSeason.update({
        where: { id: seasonId },
        data: { name, isActive },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "UPDATE_LEADERBOARD_SEASON",
          entityName: "LeaderboardSeason",
          entityId: seasonId,
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
    return NextResponse.json({ success: true, season });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
