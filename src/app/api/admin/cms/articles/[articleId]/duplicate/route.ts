import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCmsEditor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ articleId: string }> }) {
  try {
    assertSameOrigin(request); const admin = await requireCmsEditor(); const { articleId } = await context.params;
    const source = await prisma.cmsArticle.findUnique({ where: { id: articleId } });
    if (!source) return NextResponse.json({ success: false, error: "Artikel tidak ditemukan." }, { status: 404 });
    const article = await prisma.cmsArticle.create({ data: { title: `${source.title} (Salinan)`, slug: `${source.slug}-salinan-${Date.now()}`, excerpt: source.excerpt, content: source.content, coverImageUrl: source.coverImageUrl, categoryId: source.categoryId, authorUserId: admin.id, updatedByUserId: admin.id, status: "DRAFT" } });
    return NextResponse.json({ success: true, article }, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}

