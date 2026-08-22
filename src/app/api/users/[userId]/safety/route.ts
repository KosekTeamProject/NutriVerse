import { ConnectionStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ userId: string }> };

function pairKey(left: string, right: string) {
  return [left, right].sort().join(":");
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { userId: targetUserId } = await context.params;
    if (targetUserId === user.id) return NextResponse.json({ success: false, error: "Aksi tidak tersedia untuk akun sendiri." }, { status: 400 });
    const body = await request.json().catch(() => null) as { action?: unknown } | null;
    if (body?.action === "mute") {
      await prisma.userMute.upsert({ where: { muterId_mutedId: { muterId: user.id, mutedId: targetUserId } }, create: { muterId: user.id, mutedId: targetUserId }, update: {} });
      return NextResponse.json({ success: true, state: "MUTED" });
    }
    if (body?.action === "unmute") {
      await prisma.userMute.deleteMany({ where: { muterId: user.id, mutedId: targetUserId } });
      return NextResponse.json({ success: true, state: "NONE" });
    }
    if (body?.action === "block") {
      const connection = await prisma.userConnection.upsert({
        where: { pairKey: pairKey(user.id, targetUserId) },
        create: { pairKey: pairKey(user.id, targetUserId), requesterId: user.id, addresseeId: targetUserId, status: ConnectionStatus.BLOCKED, blockedById: user.id },
        update: { status: ConnectionStatus.BLOCKED, blockedById: user.id },
      });
      await prisma.userMute.deleteMany({ where: { muterId: user.id, mutedId: targetUserId } });
      return NextResponse.json({ success: true, state: "BLOCKED", connectionId: connection.id });
    }
    return NextResponse.json({ success: false, error: "Aksi keamanan tidak valid." }, { status: 400 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
