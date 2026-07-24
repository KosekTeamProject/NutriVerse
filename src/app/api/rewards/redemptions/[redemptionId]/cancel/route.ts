import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { cancelRedemption } from "@/server/rewards/reward-service";

type RouteContext = { params: Promise<{ redemptionId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "reward:cancel", 10, 60 * 60_000);
    const user = await requireCurrentUser();
    const { redemptionId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const reason = stringValue(
      body?.reason ?? "Dibatalkan oleh pengguna.",
      "Alasan",
      { min: 3, max: 500 },
    );
    const result = await cancelRedemption({
      redemptionId,
      ownerUserId: user.id,
      reason,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "REDEMPTION_NOT_FOUND"
    ) {
      return apiErrorResponse(
        new ApiRequestError(
          "Penukaran tidak ditemukan.",
          404,
          error.message,
        ),
      );
    }
    if (
      error instanceof Error &&
      error.message === "REDEMPTION_ALREADY_FINAL"
    ) {
      return apiErrorResponse(
        new ApiRequestError(
          "Penukaran sudah selesai dan tidak dapat dibatalkan.",
          409,
          error.message,
        ),
      );
    }
    return apiErrorResponse(error);
  }
}
