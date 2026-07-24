import { ConnectionStatus, PrivacyLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedPublicStorageUrl } from "@/lib/storage-ownership";

async function connectedUserIds(userId: string) {
  const connections = await prisma.userConnection.findMany({
    where: {
      status: ConnectionStatus.ACCEPTED,
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  return connections.map((connection) =>
    connection.requesterId === userId
      ? connection.addresseeId
      : connection.requesterId,
  );
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 20, 1),
      50,
    );
    const cursor = searchParams.get("cursor") || undefined;
    const friendIds = await connectedUserIds(user.id);
    const moments = await prisma.moment.findMany({
      where: {
        isHidden: false,
        OR: [
          { userId: user.id },
          { privacyLevel: PrivacyLevel.PUBLIC },
          {
            privacyLevel: PrivacyLevel.CIRCLE,
            userId: { in: friendIds },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        activitySession: {
          select: {
            id: true,
            activityType: true,
            distanceMeters: true,
            durationSeconds: true,
            verificationStatus: true,
          },
        },
        reactions: true,
        _count: { select: { reactions: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = moments.length > limit;
    const page = hasMore ? moments.slice(0, limit) : moments;
    return NextResponse.json({
      success: true,
      moments: page,
      nextCursor: hasMore ? page.at(-1)?.id : null,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "moment:create", 10, 60_000);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const imageUrl = ownedPublicStorageUrl(
      body?.imageUrl,
      user.authUserId,
      ["post-images"],
    );
    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Foto Moment harus berasal dari upload pengguna sendiri.",
        },
        { status: 400 },
      );
    }
    const privacyLevel =
      typeof body?.privacyLevel === "string" &&
      Object.values(PrivacyLevel).includes(
        body.privacyLevel as PrivacyLevel,
      )
        ? (body.privacyLevel as PrivacyLevel)
        : PrivacyLevel.PUBLIC;
    const activitySessionId =
      typeof body?.activitySessionId === "string"
        ? body.activitySessionId
        : null;
    if (activitySessionId) {
      const ownedActivity = await prisma.activitySession.findFirst({
        where: { id: activitySessionId, userId: user.id },
        select: { id: true },
      });
      if (!ownedActivity) {
        return NextResponse.json(
          { success: false, error: "Aktivitas tidak ditemukan." },
          { status: 404 },
        );
      }
    }
    const caption =
      body?.caption === undefined || body.caption === null
        ? null
        : stringValue(body.caption, "Caption", { max: 280 });
    const moment = await prisma.moment.create({
      data: {
        userId: user.id,
        activitySessionId,
        imageUrl,
        caption,
        privacyLevel,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
    return NextResponse.json({ success: true, moment }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
