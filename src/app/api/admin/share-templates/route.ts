import { ShareTemplateAspectRatio, ShareTemplateStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTemplateLayout, SHARE_TEMPLATE_DATA_FIELDS, templateAllowedDataKeys } from "@/server/community/share-template";

async function requireTemplateAdmin() {
  const user = await requireCurrentUser();
  if (user.role !== "ADMIN" && user.role !== "MODERATOR") throw new ApiRequestError("Akses admin diperlukan.", 403);
  return user;
}

export async function GET() {
  try {
    await requireTemplateAdmin();
    const templates = await prisma.shareTemplate.findMany({
      include: { createdBy: { select: { id: true, name: true } }, publishedBy: { select: { id: true, name: true } }, _count: { select: { moments: true } } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ success: true, templates, dataFields: SHARE_TEMPLATE_DATA_FIELDS });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireTemplateAdmin();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const layoutConfig = normalizeTemplateLayout(body?.layoutConfig);
    const aspectRatio = Object.values(ShareTemplateAspectRatio).includes(body?.aspectRatio as ShareTemplateAspectRatio)
      ? body?.aspectRatio as ShareTemplateAspectRatio
      : ShareTemplateAspectRatio.SQUARE;
    const dimensions = aspectRatio === ShareTemplateAspectRatio.STORY ? [1080, 1920]
      : aspectRatio === ShareTemplateAspectRatio.PORTRAIT ? [1080, 1350]
        : aspectRatio === ShareTemplateAspectRatio.LANDSCAPE ? [1600, 900]
          : [1080, 1080];
    const template = await prisma.shareTemplate.create({
      data: {
        name: stringValue(body?.name, "Nama template", { min: 3, max: 80 }),
        description: typeof body?.description === "string" && body.description.trim() ? stringValue(body.description, "Deskripsi", { max: 500 }) : null,
        category: stringValue(body?.category, "Kategori", { min: 3, max: 60 }),
        aspectRatio,
        width: dimensions[0],
        height: dimensions[1],
        backgroundUrl: typeof body?.backgroundUrl === "string" && body.backgroundUrl ? stringValue(body.backgroundUrl, "Background", { max: 2_000 }) : null,
        thumbnailUrl: typeof body?.thumbnailUrl === "string" && body.thumbnailUrl ? stringValue(body.thumbnailUrl, "Thumbnail", { max: 2_000 }) : null,
        layoutConfig,
        allowedDataKeys: templateAllowedDataKeys(layoutConfig),
        status: ShareTemplateStatus.DRAFT,
        createdByUserId: user.id,
      },
    });
    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
