import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 30, 1), 100);
    const entries = await prisma.journalEntry.findMany({
      where: { userId: user.id },
      include: { attachments: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ success: true, entries });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const entry = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        content: stringValue(body?.content, "Isi jurnal", { min: 1, max: 5000 }),
        mood:
          typeof body?.mood === "string" && body.mood.trim()
            ? stringValue(body.mood, "Mood", { max: 50 })
            : null,
        journeyEntries: { create: { userId: user.id } },
      },
    });
    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
