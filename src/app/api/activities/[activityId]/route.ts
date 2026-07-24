import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ activityId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { activityId } = await context.params;
    const activity = await prisma.activitySession.findFirst({
      where: { id: activityId, userId: user.id },
      include: {
        verificationResult: true,
        telemetrySamples: { orderBy: [{ sequenceNumber: "asc" }, { timestamp: "asc" }] },
        xpGrants: true,
        hpLedgerEntries: true,
      },
    });
    if (!activity) return NextResponse.json({ success: false, error: "Aktivitas tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ success: true, activity });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
