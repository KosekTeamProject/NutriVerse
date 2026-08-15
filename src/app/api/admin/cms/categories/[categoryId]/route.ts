import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireCmsEditor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, context: { params: Promise<{ categoryId: string }> }) {
  try { assertSameOrigin(request); await requireCmsEditor(); const { categoryId } = await context.params; const body = await request.json(); const category = await prisma.cmsCategory.update({ where: { id: categoryId }, data: { ...(body.name !== undefined ? { name: stringValue(body.name, "Nama kategori", { min: 2, max: 80 }) } : {}), ...(body.slug !== undefined ? { slug: stringValue(body.slug, "Slug", { min: 2, max: 80 }) } : {}), ...(body.description !== undefined ? { description: typeof body.description === "string" ? body.description.slice(0, 500) : null } : {}) } }); return NextResponse.json({ success: true, category }); } catch (error) { return apiErrorResponse(error); }
}
export async function DELETE(request: NextRequest, context: { params: Promise<{ categoryId: string }> }) {
  try { assertSameOrigin(request); await requireCmsEditor(); const { categoryId } = await context.params; const count = await prisma.cmsArticle.count({ where: { categoryId } }); if (count > 0) return NextResponse.json({ success: false, error: "Kategori masih digunakan artikel." }, { status: 409 }); await prisma.cmsCategory.delete({ where: { id: categoryId } }); return NextResponse.json({ success: true }); } catch (error) { return apiErrorResponse(error); }
}
