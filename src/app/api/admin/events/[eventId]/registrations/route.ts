import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { eventId } = await context.params;
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });
    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
