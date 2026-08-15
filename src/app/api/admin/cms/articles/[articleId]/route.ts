import { CmsPublicationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireCmsEditor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function statusValue(value: unknown) {
  if (typeof value !== "string" || !Object.values(CmsPublicationStatus).includes(value as CmsPublicationStatus)) return null;
  return value as CmsPublicationStatus;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ articleId: string }> }) {
  try {
    assertSameOrigin(request);
    const admin = await requireCmsEditor();
    const { articleId } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const status = body?.status === undefined ? undefined : statusValue(body.status);
    if (body?.status !== undefined && !status) return NextResponse.json({ success: false, error: "Status artikel tidak valid." }, { status: 400 });
    const existing = await prisma.cmsArticle.findUnique({ where: { id: articleId } });
    if (!existing) return NextResponse.json({ success: false, error: "Artikel tidak ditemukan." }, { status: 404 });
    const reason = typeof body?.reason === "string" ? body.reason.slice(0, 500) : null;
    const article = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.cmsArticle.update({
        where: { id: articleId },
        data: {
        ...(body?.title !== undefined ? { title: stringValue(body.title, "Judul", { min: 3, max: 180 }) } : {}),
        ...(body?.slug !== undefined ? { slug: stringValue(body.slug, "Slug", { min: 3, max: 180 }) } : {}),
        ...(body?.content !== undefined ? { content: stringValue(body.content, "Konten", { min: 1, max: 100_000 }) } : {}),
        ...(body?.excerpt !== undefined ? { excerpt: typeof body.excerpt === "string" ? body.excerpt.slice(0, 500) : null } : {}),
        ...(body?.coverImageUrl !== undefined ? { coverImageUrl: typeof body.coverImageUrl === "string" ? body.coverImageUrl.slice(0, 2_000) : null } : {}),
        ...(body?.categoryId !== undefined ? { categoryId: typeof body.categoryId === "string" ? body.categoryId : null } : {}),
        ...(body?.isFeatured !== undefined ? { isFeatured: body.isFeatured === true } : {}),
        ...(status ? { status, rejectionReason: status === CmsPublicationStatus.DRAFT ? reason : null, publishedAt: status === CmsPublicationStatus.PUBLISHED ? new Date() : undefined, publishedByUserId: status === CmsPublicationStatus.PUBLISHED ? admin.id : undefined } : {}),
        updatedByUserId: admin.id,
        },
      });
      const revisionCount = await transaction.cmsArticleRevision.count({ where: { articleId } });
      await transaction.cmsArticleRevision.create({ data: { articleId, version: revisionCount + 1, title: updated.title, slug: updated.slug, excerpt: updated.excerpt, content: updated.content, coverImageUrl: updated.coverImageUrl, status: updated.status, savedByUserId: admin.id } });
      if (status && status !== existing.status) await transaction.cmsArticleStatusHistory.create({ data: { articleId, fromStatus: existing.status, toStatus: status, reason, changedByUserId: admin.id } });
      if (Array.isArray(body?.tagIds)) {
        const tagIds = body.tagIds.filter((tagId: unknown): tagId is string => typeof tagId === "string").slice(0, 30);
        await transaction.cmsArticleTag.deleteMany({ where: { articleId } });
        if (tagIds.length) await transaction.cmsArticleTag.createMany({ data: tagIds.map((tagId: string) => ({ articleId, tagId })), skipDuplicates: true });
      }
      await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "UPDATE_CMS_ARTICLE", entityName: "CmsArticle", entityId: updated.id, afterState: updated } });
      return updated;
    });
    if (status === CmsPublicationStatus.PUBLISHED || status === CmsPublicationStatus.DRAFT) {
      await prisma.userNotification.create({ data: { userId: existing.authorUserId, type: "SYSTEM", title: status === CmsPublicationStatus.PUBLISHED ? "Artikel diterbitkan" : "Artikel perlu diperbaiki", message: status === CmsPublicationStatus.PUBLISHED ? `Artikel “${article.title}” telah dipublikasikan.` : `Artikel “${article.title}” dikembalikan ke draft.${reason ? ` Alasan: ${reason}` : ""}` } });
    }
    return NextResponse.json({ success: true, article });
  } catch (error) { return apiErrorResponse(error); }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ articleId: string }> }) {
  try {
    assertSameOrigin(request);
    const admin = await requireCmsEditor();
    const { articleId } = await context.params;
    const article = await prisma.cmsArticle.update({ where: { id: articleId }, data: { status: CmsPublicationStatus.ARCHIVED, updatedByUserId: admin.id } });
    await prisma.auditLog.create({ data: { actorUserId: admin.id, action: "ARCHIVE_CMS_ARTICLE", entityName: "CmsArticle", entityId: article.id, afterState: article } });
    return NextResponse.json({ success: true, article });
  } catch (error) { return apiErrorResponse(error); }
}

