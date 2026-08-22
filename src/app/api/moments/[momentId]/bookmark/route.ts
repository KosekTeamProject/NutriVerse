import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visibleMomentWhere } from "@/server/community/moment-access";

type RouteContext = { params: Promise<{ momentId: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    const moment = await prisma.moment.findFirst({ where: visibleMomentWhere(user.id, momentId), select: { id: true } });
    if (!moment) return NextResponse.json({ success: false, error: "Momen tidak ditemukan." }, { status: 404 });
    const bookmark = await prisma.momentBookmark.upsert({
      where: { momentId_userId: { momentId, userId: user.id } },
      create: { momentId, userId: user.id },
      update: {},
    });
    return NextResponse.json({ success: true, bookmark });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    await prisma.momentBookmark.deleteMany({ where: { momentId, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
