import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedStoragePath } from "@/lib/storage-ownership";

type RouteContext = { params: Promise<{ entryId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { entryId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const path = ownedStoragePath(body?.path, user.authUserId);
    if (!path) {
      return NextResponse.json(
        { success: false, error: "Path lampiran tidak valid." },
        { status: 400 },
      );
    }
    const journal = await prisma.journalEntry.findFirst({
      where: { id: entryId, userId: user.id },
      select: { id: true, _count: { select: { attachments: true } } },
    });
    if (!journal) {
      return NextResponse.json(
        { success: false, error: "Jurnal tidak ditemukan." },
        { status: 404 },
      );
    }
    if (journal._count.attachments >= 10) {
      return NextResponse.json(
        { success: false, error: "Maksimal 10 lampiran per jurnal." },
        { status: 409 },
      );
    }
    const attachment = await prisma.journalAttachment.create({
      data: {
        journalEntryId: journal.id,
        fileUrl: `journal-attachments/${path}`,
        fileType: "IMAGE",
      },
    });
    return NextResponse.json(
      { success: true, attachment },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
