import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCmsEditor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ articleId: string }> }) { try { await requireCmsEditor(); const { articleId } = await context.params; const [revisions, statusHistory] = await Promise.all([prisma.cmsArticleRevision.findMany({ where: { articleId }, orderBy: { version: "desc" }, take: 100 }), prisma.cmsArticleStatusHistory.findMany({ where: { articleId }, orderBy: { createdAt: "desc" }, take: 100 })]); return NextResponse.json({ success: true, revisions, statusHistory }); } catch (error) { return apiErrorResponse(error); } }
