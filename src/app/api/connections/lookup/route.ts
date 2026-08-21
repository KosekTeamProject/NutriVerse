import { ConnectionStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, enforceRateLimit } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function pairKey(left: string, right: string) {
  return [left, right].sort().join(":");
}

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "connection:username-lookup", 30, 60 * 60_000);
    const currentUser = await requireCurrentUser();
    const username = (request.nextUrl.searchParams.get("username") ?? "").trim().replace(/^@+/, "").toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      throw new ApiRequestError("Masukkan username yang valid dan lengkap.");
    }
    const target = await prisma.user.findFirst({
      where: { id: { not: currentUser.id }, username: { equals: username, mode: "insensitive" }, isSuspended: false },
      select: { id: true, name: true, username: true, avatarUrl: true },
    });
    if (!target) throw new ApiRequestError("Username tidak ditemukan.", 404, "USERNAME_NOT_FOUND");
    const connection = await prisma.userConnection.findUnique({
      where: { pairKey: pairKey(currentUser.id, target.id) },
      select: { requesterId: true, status: true },
    });
    if (connection?.status === ConnectionStatus.BLOCKED) {
      throw new ApiRequestError("Username tidak ditemukan.", 404, "USERNAME_NOT_FOUND");
    }
    const relationship = connection?.status === ConnectionStatus.ACCEPTED
      ? "friends"
      : connection?.status === ConnectionStatus.PENDING
        ? connection.requesterId === currentUser.id ? "outgoing" : "incoming"
        : "none";
    return NextResponse.json({ success: true, user: target, relationship });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
