import { RedemptionStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  stringValue,
} from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import {
  cancelRedemption,
  expireRedemption,
  fulfillRedemption,
} from "@/server/rewards/reward-service";

type RouteContext = { params: Promise<{ redemptionId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { redemptionId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const reason = stringValue(body?.reason, "Alasan", {
      min: 3,
      max: 500,
    });
    let result;
    if (body?.status === RedemptionStatus.FULFILLED) {
      result = await fulfillRedemption({
        redemptionId,
        actorUserId: admin.id,
        fulfillmentReference: stringValue(
          body?.fulfillmentReference,
          "Referensi fulfillment",
          { min: 3, max: 200 },
        ),
        reason,
      });
    } else if (body?.status === RedemptionStatus.CANCELLED) {
      result = await cancelRedemption({
        redemptionId,
        actorUserId: admin.id,
        reason,
      });
    } else if (body?.status === RedemptionStatus.EXPIRED) {
      result = await expireRedemption(redemptionId, reason, admin.id);
    } else {
      throw new ApiRequestError("Status penukaran tidak valid.");
    }
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "REDEMPTION_NOT_FOUND") {
        return apiErrorResponse(
          new ApiRequestError("Penukaran tidak ditemukan.", 404),
        );
      }
      if (
        error.message === "REDEMPTION_ALREADY_FINAL" ||
        error.message === "REDEMPTION_EXPIRED"
      ) {
        return apiErrorResponse(
          new ApiRequestError(
            "Status penukaran tidak dapat diubah.",
            409,
            error.message,
          ),
        );
      }
    }
    return apiErrorResponse(error);
  }
}
