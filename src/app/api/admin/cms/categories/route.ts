import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireCmsEditor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try { await requireCmsEditor(); return NextResponse.json({ success: true, categories: await prisma.cmsCategory.findMany({ orderBy: { name: "asc" } }) }); }
  catch (error) { return apiErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); const admin = await requireCmsEditor();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const category = await prisma.cmsCategory.create({ data: { name: stringValue(body?.name, "Nama kategori", { min: 2, max: 80 }), slug: stringValue(body?.slug, "Slug", { min: 2, max: 80 }), description: typeof body?.description === "string" ? body.description.slice(0, 500) : null } });
    await prisma.auditLog.create({ data: { actorUserId: admin.id, action: "CREATE_CMS_CATEGORY", entityName: "CmsCategory", entityId: category.id, afterState: category } });
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}

