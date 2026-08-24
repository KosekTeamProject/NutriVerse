import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCompanionExchange } from "@/server/companion/companion-chat-service";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const newest = await prisma.companionConversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 80,
    });
    return NextResponse.json({
      success: true,
      messages: newest.reverse(),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "companion:message", 30, 60_000);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const content = stringValue(body?.content, "Pesan", {
      min: 1,
      max: 2_000,
    });
    const { userMessage, assistantMessage, answer } =
      await createCompanionExchange({ userId: user.id, message: content });
    return NextResponse.json(
      {
        success: true,
        messages: [userMessage, assistantMessage],
        safety: answer.safety,
        scope: answer.scope,
        grounding: answer.grounding,
        sources: answer.sources,
        requestId: answer.requestId,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
