import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ entryId: string; attachmentId: string }>;
};

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { entryId, attachmentId } = await context.params;
    const attachment = await prisma.journalAttachment.findFirst({
      where: {
        id: attachmentId,
        journalEntryId: entryId,
        journalEntry: { userId: user.id },
      },
    });
    if (!attachment) {
      return NextResponse.json(
        { success: false, error: "Lampiran tidak ditemukan." },
        { status: 404 },
      );
    }
    await prisma.journalAttachment.delete({
      where: { id: attachment.id },
    });
    const prefix = "journal-attachments/";
    if (attachment.fileUrl.startsWith(prefix)) {
      const supabase = await createSupabaseServerClient();
      await supabase.storage
        .from("journal-attachments")
        .remove([attachment.fileUrl.slice(prefix.length)]);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
