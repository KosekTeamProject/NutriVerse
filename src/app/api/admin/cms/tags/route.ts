import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireCmsEditor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try { await requireCmsEditor(); return NextResponse.json({ success: true, tags: await prisma.cmsTag.findMany({ orderBy: { name: "asc" } }) }); }
  catch (error) { return apiErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); const admin = await requireCmsEditor();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const tag = await prisma.cmsTag.create({ data: { name: stringValue(body?.name, "Nama tag", { min: 2, max: 50 }), slug: stringValue(body?.slug, "Slug", { min: 2, max: 50 }) } });
    await prisma.auditLog.create({ data: { actorUserId: admin.id, action: "CREATE_CMS_TAG", entityName: "CmsTag", entityId: tag.id, afterState: tag } });
    return NextResponse.json({ success: true, tag }, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}

