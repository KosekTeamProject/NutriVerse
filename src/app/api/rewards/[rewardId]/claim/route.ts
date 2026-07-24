import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { redeemReward } from "@/server/rewards/reward-service";

type RouteContext = { params: Promise<{ rewardId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "reward:claim", 10, 60 * 60_000);
    const user = await requireCurrentUser();
    const { rewardId } = await context.params;
    const body = (await request.json().catch(() => null)) as { idempotencyKey?: unknown } | null;
    const idempotencyKey = stringValue(
      body?.idempotencyKey ?? request.headers.get("idempotency-key"),
      "Idempotency key",
      { min: 8, max: 100 },
    );
    const result = await redeemReward(user.id, rewardId, idempotencyKey);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "REWARD_NOT_AVAILABLE") return apiErrorResponse(new ApiRequestError("Reward tidak tersedia.", 404, error.message));
      if (error.message === "REWARD_OUT_OF_STOCK") return apiErrorResponse(new ApiRequestError("Stok reward habis.", 409, error.message));
      if (error.message === "INSUFFICIENT_HP") return apiErrorResponse(new ApiRequestError("Saldo HP tidak mencukupi.", 409, error.message));
    }
    return apiErrorResponse(error);
  }
}
