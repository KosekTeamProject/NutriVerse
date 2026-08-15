import { CmsPublicationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireCmsEditor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function statusValue(value: unknown) {
  return typeof value === "string" && Object.values(CmsPublicationStatus).includes(value as CmsPublicationStatus)
    ? (value as CmsPublicationStatus)
    : CmsPublicationStatus.DRAFT;
}

export async function GET(request: NextRequest) {
  try {
    await requireCmsEditor();
    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(params.get("pageSize") ?? 10) || 10));
    const search = params.get("search")?.trim();
    const status = params.get("status");
    const categoryId = params.get("categoryId");
    const where = {
      ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { slug: { contains: search, mode: "insensitive" as const } }] } : {}),
      ...(status && Object.values(CmsPublicationStatus).includes(status as CmsPublicationStatus) ? { status: status as CmsPublicationStatus } : {}),
      ...(categoryId ? { categoryId } : {}),
    };
    const articles = await prisma.cmsArticle.findMany({
      where,
      include: { category: true, author: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const total = await prisma.cmsArticle.count({ where });
    return NextResponse.json({ success: true, articles, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await requireCmsEditor();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const article = await prisma.cmsArticle.create({
      data: {
        title: stringValue(body?.title, "Judul", { min: 3, max: 180 }),
        slug: stringValue(body?.slug, "Slug", { min: 3, max: 180 }),
        excerpt: typeof body?.excerpt === "string" ? body.excerpt.slice(0, 500) : null,
        content: stringValue(body?.content, "Konten", { min: 1, max: 100_000 }),
        coverImageUrl: typeof body?.coverImageUrl === "string" ? body.coverImageUrl.slice(0, 2_000) : null,
        categoryId: typeof body?.categoryId === "string" ? body.categoryId : null,
        status: statusValue(body?.status),
        isFeatured: body?.isFeatured === true,
        authorUserId: admin.id,
        updatedByUserId: admin.id,
        publishedAt: statusValue(body?.status) === CmsPublicationStatus.PUBLISHED ? new Date() : null,
        publishedByUserId: statusValue(body?.status) === CmsPublicationStatus.PUBLISHED ? admin.id : null,
      },
    });
    await prisma.auditLog.create({
      data: { actorUserId: admin.id, action: "CREATE_CMS_ARTICLE", entityName: "CmsArticle", entityId: article.id, afterState: article },
    });
    return NextResponse.json({ success: true, article }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

