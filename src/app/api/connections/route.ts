import {
  ConnectionStatus,
  NotificationType,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserNotification } from "@/server/notifications/notification-service";

function connectionPairKey(left: string, right: string) {
  return [left, right].sort().join(":");
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 100, 1),
      250,
    );
    const cursor = searchParams.get("cursor") || undefined;
    const incomingOnly = searchParams.get("incoming") === "true";
    const list = searchParams.get("list");
    const where = incomingOnly
      ? { addresseeId: user.id, status: ConnectionStatus.PENDING }
      : list === "friends"
        ? {
            status: ConnectionStatus.ACCEPTED,
            OR: [{ requesterId: user.id }, { addresseeId: user.id }],
          }
          : { OR: [{ requesterId: user.id }, { addresseeId: user.id }] };
    const connections = await prisma.userConnection.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        addressee: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = connections.length > limit;
    const page = hasMore ? connections.slice(0, limit) : connections;
    const responseConnections = list === "friends"
      ? page.map((connection) => ({
          ...connection,
          friend: connection.requesterId === user.id
            ? connection.addressee
            : connection.requester,
        }))
      : page;
    return NextResponse.json({
      success: true,
      connections: responseConnections,
      nextCursor: hasMore ? page.at(-1)?.id : null,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "connection:request", 20, 60 * 60_000);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const targetUserId = stringValue(body?.targetUserId, "Target pengguna", {
      max: 100,
    });
    if (targetUserId === user.id) {
      return NextResponse.json(
        { success: false, error: "Tidak dapat menghubungkan akun sendiri." },
        { status: 400 },
      );
    }
    const target = await prisma.user.findFirst({
      where: { id: targetUserId, isSuspended: false },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan." },
        { status: 404 },
      );
    }
    const pairKey = connectionPairKey(user.id, targetUserId);
    const existing = await prisma.userConnection.findUnique({
      where: { pairKey },
    });
    if (existing) {
      if (existing.status === ConnectionStatus.BLOCKED) {
        return NextResponse.json(
          { success: false, error: "Permintaan koneksi tidak tersedia." },
          { status: 403 },
        );
      }
      if (existing.status === ConnectionStatus.ACCEPTED) {
        return NextResponse.json({
          success: true,
          connection: existing,
          idempotentReplay: true,
        });
      }
      if (existing.requesterId === user.id) {
        return NextResponse.json({
          success: true,
          connection: existing,
          idempotentReplay: true,
        });
      }
      const accepted = await prisma.userConnection.update({
        where: { id: existing.id },
        data: {
          status: ConnectionStatus.ACCEPTED,
          blockedById: null,
        },
      });
      await createUserNotification({
        userId: existing.requesterId,
        type: NotificationType.SOCIAL,
        title: "Permintaan koneksi diterima",
        message: `${user.name} menerima permintaan koneksimu.`,
        actionUrl: `/profil/${user.id}`,
        dedupeKey: `connection-accepted:${existing.id}`,
      });
      return NextResponse.json({ success: true, connection: accepted });
    }
    const connection = await prisma.userConnection.create({
      data: {
        pairKey,
        requesterId: user.id,
        addresseeId: targetUserId,
      },
    });
    await createUserNotification({
      userId: targetUserId,
      type: NotificationType.SOCIAL,
      title: "Permintaan koneksi baru",
      message: `${user.name} ingin terhubung denganmu di NutriVerse.`,
      actionUrl: `/profil/${user.id}`,
      dedupeKey: `connection-request:${connection.id}`,
    });
    return NextResponse.json({ success: true, connection }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
