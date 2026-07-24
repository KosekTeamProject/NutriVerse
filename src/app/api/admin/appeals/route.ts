import { AppealStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const statusValue = searchParams.get("status");
    const status =
      statusValue &&
      Object.values(AppealStatus).includes(statusValue as AppealStatus)
        ? (statusValue as AppealStatus)
        : undefined;
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 30, 1),
      100,
    );
    const appeals = await prisma.appeal.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: { id: true, name: true, email: true, username: true },
        },
        activitySession: {
          include: { verificationResult: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    return NextResponse.json({ success: true, appeals });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
