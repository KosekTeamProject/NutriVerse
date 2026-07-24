import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ entryId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { entryId } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const existing = await prisma.journalEntry.findFirst({ where: { id: entryId, userId: user.id } });
    if (!existing) return NextResponse.json({ success: false, error: "Jurnal tidak ditemukan." }, { status: 404 });
    const entry = await prisma.journalEntry.update({
      where: { id: existing.id },
      data: {
        ...(body?.content !== undefined ? { content: stringValue(body.content, "Isi jurnal", { max: 5000 }) } : {}),
        ...(body?.mood !== undefined ? { mood: body.mood === "" ? null : stringValue(body.mood, "Mood", { max: 50 }) } : {}),
      },
    });
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { entryId } = await context.params;
    const result = await prisma.journalEntry.deleteMany({ where: { id: entryId, userId: user.id } });
    if (!result.count) return NextResponse.json({ success: false, error: "Jurnal tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
