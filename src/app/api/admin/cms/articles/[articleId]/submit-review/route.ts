import { CmsPublicationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCmsEditor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ articleId: string }> }) { try { assertSameOrigin(request); const user = await requireCmsEditor(); const { articleId } = await context.params; const article = await prisma.cmsArticle.update({ where: { id: articleId }, data: { status: CmsPublicationStatus.REVIEW, updatedByUserId: user.id } }); await prisma.cmsArticleStatusHistory.create({ data: { articleId, toStatus: CmsPublicationStatus.REVIEW, changedByUserId: user.id } }); return NextResponse.json({ success: true, article }); } catch (error) { return apiErrorResponse(error); } }
