import { PrivacyLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ journeyId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { journeyId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const privacyLevel =
      typeof body?.privacyLevel === "string" &&
      Object.values(PrivacyLevel).includes(
        body.privacyLevel as PrivacyLevel,
      )
        ? (body.privacyLevel as PrivacyLevel)
        : null;
    if (!privacyLevel) {
      return NextResponse.json(
        { success: false, error: "Privasi Journey tidak valid." },
        { status: 400 },
      );
    }
    const result = await prisma.journeyEntry.updateMany({
      where: { id: journeyId, userId: user.id },
      data: { privacyLevel },
    });
    if (!result.count) {
      return NextResponse.json(
        { success: false, error: "Journey tidak ditemukan." },
        { status: 404 },
      );
    }
    const entry = await prisma.journeyEntry.findUnique({
      where: { id: journeyId },
    });
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { journeyId } = await context.params;
    const result = await prisma.journeyEntry.deleteMany({
      where: { id: journeyId, userId: user.id },
    });
    if (!result.count) {
      return NextResponse.json(
        { success: false, error: "Journey tidak ditemukan." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
