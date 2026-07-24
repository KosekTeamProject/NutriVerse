import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ entryId: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { entryId } = await context.params;
    const result = await prisma.nutritionEntry.deleteMany({
      where: { id: entryId, userId: user.id },
    });
    if (!result.count) {
      return NextResponse.json({ success: false, error: "Catatan nutrisi tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
