import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { finalizeLeaderboardSeason } from "@/server/leaderboard/season-finalization-service";

type RouteContext = { params: Promise<{ seasonId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { seasonId } = await context.params;
    const result = await finalizeLeaderboardSeason({ seasonId, adminUserId: admin.id });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "SEASON_NOT_FOUND") {
      return apiErrorResponse(new ApiRequestError("Season tidak ditemukan.", 404, error.message));
    }
    if (error instanceof Error && error.message === "SEASON_NOT_FINISHED") {
      return apiErrorResponse(new ApiRequestError("Season belum berakhir dan belum dapat difinalisasi.", 409, error.message));
    }
    return apiErrorResponse(error);
  }
}
