import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const entityName = searchParams.get("entityName")?.trim().slice(0, 100);
    const actorUserId = searchParams.get("actorUserId")?.trim().slice(0, 100);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 100, 1),
      250,
    );
    const logs = await prisma.auditLog.findMany({
      where: {
        entityName: entityName || undefined,
        actorUserId: actorUserId || undefined,
      },
      include: {
        actorUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
