import { PrivacyLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ momentId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const existing = await prisma.moment.findFirst({
      where: { id: momentId, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Moment tidak ditemukan." },
        { status: 404 },
      );
    }
    const privacyLevel =
      typeof body?.privacyLevel === "string" &&
      Object.values(PrivacyLevel).includes(
        body.privacyLevel as PrivacyLevel,
      )
        ? (body.privacyLevel as PrivacyLevel)
        : undefined;
    const caption =
      body?.caption === undefined
        ? undefined
        : body.caption === null || body.caption === ""
          ? null
          : stringValue(body.caption, "Caption", { max: 280 });
    const moment = await prisma.moment.update({
      where: { id: existing.id },
      data: { caption, privacyLevel },
    });
    return NextResponse.json({ success: true, moment });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    const result = await prisma.moment.deleteMany({
      where: { id: momentId, userId: user.id },
    });
    if (!result.count) {
      return NextResponse.json(
        { success: false, error: "Moment tidak ditemukan." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
