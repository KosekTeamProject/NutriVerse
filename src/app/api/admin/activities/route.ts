import {
  ActivityProcessingStatus,
  VerificationStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const requestedVerification = searchParams.get("verificationStatus");
    const verificationStatus =
      requestedVerification &&
      Object.values(VerificationStatus).includes(
        requestedVerification as VerificationStatus,
      )
        ? (requestedVerification as VerificationStatus)
        : undefined;
    const requestedProcessing = searchParams.get("processingStatus");
    const processingStatus =
      requestedProcessing &&
      Object.values(ActivityProcessingStatus).includes(
        requestedProcessing as ActivityProcessingStatus,
      )
        ? (requestedProcessing as ActivityProcessingStatus)
        : undefined;
    const reviewQueue = searchParams.get("reviewQueue") === "true";
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 100, 1),
      250,
    );
    const activities = await prisma.activitySession.findMany({
      where: {
        processingStatus,
        verificationStatus: reviewQueue
          ? {
              in: [
                VerificationStatus.NEEDS_REVIEW,
                VerificationStatus.MANUAL_REVIEW,
              ],
            }
          : verificationStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        verificationResult: true,
        appeals: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { startTime: "desc" },
      take: limit,
    });
    return NextResponse.json({ success: true, activities });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
