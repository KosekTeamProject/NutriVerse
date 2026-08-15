import { CmsPublicationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCmsEditor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); const admin = await requireCmsEditor();
    const body = (await request.json().catch(() => null)) as { ids?: unknown; action?: unknown } | null;
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id): id is string => typeof id === "string").slice(0, 100) : [];
    const action = body?.action === "publish" ? CmsPublicationStatus.PUBLISHED : body?.action === "archive" ? CmsPublicationStatus.ARCHIVED : null;
    if (!action || ids.length === 0) return NextResponse.json({ success: false, error: "Aksi bulk atau artikel tidak valid." }, { status: 400 });
    const result = await prisma.cmsArticle.updateMany({ where: { id: { in: ids } }, data: { status: action, updatedByUserId: admin.id, ...(action === CmsPublicationStatus.PUBLISHED ? { publishedAt: new Date(), publishedByUserId: admin.id } : {}) } });
    await prisma.auditLog.create({ data: { actorUserId: admin.id, action: `BULK_${action}_CMS_ARTICLES`, entityName: "CmsArticle", entityId: ids.join(","), afterState: { count: result.count } } });
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) { return apiErrorResponse(error); }
}

