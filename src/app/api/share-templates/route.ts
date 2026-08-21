import { ShareTemplateStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireCurrentUser();
    const templates = await prisma.shareTemplate.findMany({
      where: { status: ShareTemplateStatus.PUBLISHED },
      select: { id: true, name: true, description: true, category: true, aspectRatio: true, width: true, height: true, backgroundUrl: true, thumbnailUrl: true, layoutConfig: true, allowedDataKeys: true, version: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: 100,
    });
    return NextResponse.json({ success: true, templates }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
