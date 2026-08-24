import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { createCompanionExchange } from "@/server/companion/companion-chat-service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "companion:chat", 20, 60_000);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const message = stringValue(body?.message, "Pesan", {
      min: 1,
      max: 2_000,
    });

    // Context/progress sent by the browser is deliberately ignored. The
    // service reconstructs it from rows owned by the authenticated user.
    const exchange = await createCompanionExchange({
      userId: user.id,
      message,
    });

    return NextResponse.json({
      success: true,
      reply: exchange.answer.reply,
      safety: exchange.answer.safety,
      scope: exchange.answer.scope,
      grounding: exchange.answer.grounding,
      sources: exchange.answer.sources,
      requestId: exchange.answer.requestId,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
