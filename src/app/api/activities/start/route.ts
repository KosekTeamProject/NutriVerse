import { ActivityType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const activityType =
      typeof body?.activityType === "string" &&
      Object.values(ActivityType).includes(body.activityType as ActivityType)
        ? (body.activityType as ActivityType)
        : null;
    if (!activityType) {
      return NextResponse.json({ success: false, error: "Jenis aktivitas tidak valid." }, { status: 400 });
    }
    const clientSessionId =
      body?.clientSessionId === undefined
        ? undefined
        : stringValue(body.clientSessionId, "Client session ID", { max: 100 });
    const startTime =
      typeof body?.startTime === "string" ? new Date(body.startTime) : new Date();
    if (Number.isNaN(startTime.getTime()) || startTime.getTime() > Date.now() + 60_000) {
      return NextResponse.json({ success: false, error: "Waktu mulai tidak valid." }, { status: 400 });
    }
    const session = await prisma.activitySession.upsert({
      where: {
        userId_clientSessionId: {
          userId: user.id,
          clientSessionId: clientSessionId ?? crypto.randomUUID(),
        },
      },
      create: {
        userId: user.id,
        clientSessionId,
        activityType,
        startTime,
        isSimulated: body?.isSimulated === true,
      },
      update: {},
    });
    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
