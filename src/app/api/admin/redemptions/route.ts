import { RedemptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const requestedStatus = searchParams.get("status");
    const status =
      requestedStatus &&
      Object.values(RedemptionStatus).includes(
        requestedStatus as RedemptionStatus,
      )
        ? (requestedStatus as RedemptionStatus)
        : undefined;
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 100, 1),
      250,
    );
    const redemptions = await prisma.redemption.findMany({
      where: status ? { status } : undefined,
      include: {
        reward: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ success: true, redemptions });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
