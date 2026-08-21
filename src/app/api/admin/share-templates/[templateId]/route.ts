import { ShareTemplateAspectRatio, ShareTemplateStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTemplateLayout, templateAllowedDataKeys } from "@/server/community/share-template";

type RouteContext = { params: Promise<{ templateId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    if (user.role !== "ADMIN" && user.role !== "MODERATOR") throw new ApiRequestError("Akses admin diperlukan.", 403);
    const { templateId } = await context.params;
    const existing = await prisma.shareTemplate.findUnique({ where: { id: templateId } });
    if (!existing) throw new ApiRequestError("Template tidak ditemukan.", 404);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const publishRequested = body?.status === ShareTemplateStatus.PUBLISHED;
    if (publishRequested && user.role !== "ADMIN") throw new ApiRequestError("Hanya Super Admin yang dapat mempublikasikan template.", 403);
    const layoutConfig = body?.layoutConfig === undefined ? undefined : normalizeTemplateLayout(body.layoutConfig);
    const status = Object.values(ShareTemplateStatus).includes(body?.status as ShareTemplateStatus) ? body?.status as ShareTemplateStatus : undefined;
    const aspectRatio = Object.values(ShareTemplateAspectRatio).includes(body?.aspectRatio as ShareTemplateAspectRatio) ? body?.aspectRatio as ShareTemplateAspectRatio : undefined;
    const template = await prisma.shareTemplate.update({
      where: { id: templateId },
      data: {
        name: body?.name === undefined ? undefined : stringValue(body.name, "Nama template", { min: 3, max: 80 }),
        description: body?.description === undefined ? undefined : typeof body.description === "string" && body.description.trim() ? stringValue(body.description, "Deskripsi", { max: 500 }) : null,
        category: body?.category === undefined ? undefined : stringValue(body.category, "Kategori", { min: 3, max: 60 }),
        aspectRatio,
        backgroundUrl: body?.backgroundUrl === undefined ? undefined : typeof body.backgroundUrl === "string" && body.backgroundUrl ? stringValue(body.backgroundUrl, "Background", { max: 2_000 }) : null,
        thumbnailUrl: body?.thumbnailUrl === undefined ? undefined : typeof body.thumbnailUrl === "string" && body.thumbnailUrl ? stringValue(body.thumbnailUrl, "Thumbnail", { max: 2_000 }) : null,
        layoutConfig,
        allowedDataKeys: layoutConfig ? templateAllowedDataKeys(layoutConfig) : undefined,
        status,
        version: layoutConfig || aspectRatio || body?.backgroundUrl !== undefined ? { increment: 1 } : undefined,
        publishedByUserId: publishRequested ? user.id : status === ShareTemplateStatus.DRAFT ? null : undefined,
        publishedAt: publishRequested ? new Date() : status === ShareTemplateStatus.DRAFT ? null : undefined,
      },
    });
    return NextResponse.json({ success: true, template });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
