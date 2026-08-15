import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireCmsEditor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, context: { params: Promise<{ tagId: string }> }) { try { assertSameOrigin(request); await requireCmsEditor(); const { tagId } = await context.params; const body = await request.json(); const tag = await prisma.cmsTag.update({ where: { id: tagId }, data: { ...(body.name !== undefined ? { name: stringValue(body.name, "Nama tag", { min: 2, max: 50 }) } : {}), ...(body.slug !== undefined ? { slug: stringValue(body.slug, "Slug", { min: 2, max: 50 }) } : {}) } }); return NextResponse.json({ success: true, tag }); } catch (error) { return apiErrorResponse(error); } }
export async function DELETE(request: NextRequest, context: { params: Promise<{ tagId: string }> }) { try { assertSameOrigin(request); await requireCmsEditor(); const { tagId } = await context.params; await prisma.cmsTag.delete({ where: { id: tagId } }); return NextResponse.json({ success: true }); } catch (error) { return apiErrorResponse(error); } }
