import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiRequestError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    if (admin.role !== "ADMIN") throw new ApiRequestError("Hanya Super Admin yang dapat membuat komunitas.", 403);
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 3) throw new ApiRequestError("Nama komunitas minimal 3 karakter.");
    const community = await prisma.guild.create({ data: { name, description: typeof body.description === "string" ? body.description.trim() : null, category: typeof body.category === "string" && body.category.trim() ? body.category.trim() : "Gaya Hidup Sehat", rules: Array.isArray(body.rules) ? body.rules.filter((v: unknown): v is string => typeof v === "string") : [], emblemUrl: typeof body.emblemUrl === "string" && body.emblemUrl.trim() ? body.emblemUrl.trim() : null, leaderId: typeof body.leaderId === "string" && body.leaderId ? body.leaderId : null, approvalStatus: "APPROVED", approvedAt: new Date(), reviewedByUserId: admin.id, isActive: true } });
    return NextResponse.json({ success: true, community }, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}

export async function GET() {
  try {
    await requireAdminUser();
    const communities = await prisma.guild.findMany({
      select: {
        id: true, name: true, description: true, category: true, rules: true, joinPolicy: true, approvalStatus: true, reviewNote: true, isActive: true, createdAt: true,
        leader: { select: { id: true, name: true, username: true, economy: { select: { currentTier: true } } } },
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ success: true, communities });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
