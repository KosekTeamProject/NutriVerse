import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET() { try { const user = await requireCurrentUser(); const where = user.role === "ADMIN" || user.role === "MODERATOR" ? {} : { adminAssignments: { some: { userId: user.id } } }; return NextResponse.json({ success: true, communities: await prisma.guild.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }) }); } catch (error) { return apiErrorResponse(error); } }
