import { ReportStatus } from "@prisma/client";
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
      Object.values(ReportStatus).includes(
        requestedStatus as ReportStatus,
      )
        ? (requestedStatus as ReportStatus)
        : undefined;
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 100, 1),
      250,
    );
    const reports = await prisma.contentReport.findMany({
      where: { status },
      include: {
        reporterUser: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        moment: true,
        post: true,
        comment: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
