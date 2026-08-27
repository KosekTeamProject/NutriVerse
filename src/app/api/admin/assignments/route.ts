import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireSystemAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireSystemAdmin();
    const type = request.nextUrl.searchParams.get("type");
    if (type === "event") return NextResponse.json({ success: true, assignments: await prisma.eventAdminAssignment.findMany({ include: { event: { select: { id: true, title: true } }, user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } }) });
    if (type === "community") return NextResponse.json({ success: true, assignments: await prisma.communityAdminAssignment.findMany({ include: { guild: { select: { id: true, name: true } }, user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } }) });
    return NextResponse.json({ success: false, error: "Tipe penugasan tidak valid." }, { status: 400 });
  } catch (error) { return apiErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); const admin = await requireSystemAdmin();
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const type = body?.type; const targetId = stringValue(body?.targetId, "Target"); let userId = typeof body?.userId === "string" ? body.userId : "";
    if (!userId && typeof body?.email === "string") { const found = await prisma.user.findUnique({ where: { email: body.email.trim().toLowerCase() }, select: { id: true } }); if (!found) return NextResponse.json({ success: false, error: "User dengan email tersebut tidak ditemukan." }, { status: 404 }); userId = found.id; }
    if (!userId) return NextResponse.json({ success: false, error: "User ID atau email wajib diisi." }, { status: 400 });
    if (type === "event") return NextResponse.json({ success: true, assignment: await prisma.eventAdminAssignment.create({ data: { eventId: targetId, userId, assignedByUserId: admin.id } }), }, { status: 201 });
    if (type === "community") return NextResponse.json({ success: true, assignment: await prisma.communityAdminAssignment.create({ data: { guildId: targetId, userId, assignedByUserId: admin.id } }), }, { status: 201 });
    return NextResponse.json({ success: false, error: "Tipe penugasan tidak valid." }, { status: 400 });
  } catch (error) { return apiErrorResponse(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request); await requireSystemAdmin(); const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const type = body?.type; const id = stringValue(body?.id, "Penugasan");
    if (type === "event") await prisma.eventAdminAssignment.delete({ where: { id } });
    else if (type === "community") await prisma.communityAdminAssignment.delete({ where: { id } });
    else return NextResponse.json({ success: false, error: "Tipe penugasan tidak valid." }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) { return apiErrorResponse(error); }
}
