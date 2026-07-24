import { EventRegistrationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const includePast = searchParams.get("includePast") === "true";
    const events = await prisma.event.findMany({
      where: {
        isActive: true,
        ...(includePast ? {} : { endDate: { gte: new Date() } }),
      },
      include: {
        registrations: {
          where: { userId: user.id },
          select: { id: true, status: true, joinedAt: true, attendedAt: true },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: {
                  in: [
                    EventRegistrationStatus.JOINED,
                    EventRegistrationStatus.ATTENDED,
                  ],
                },
              },
            },
          },
        },
      },
      orderBy: { startDate: "asc" },
      take: 100,
    });
    return NextResponse.json({ success: true, events });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
