import { ConnectionStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ connectionId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { connectionId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const action =
      body?.action === "accept" || body?.action === "block"
        ? body.action
        : null;
    if (!action) {
      return NextResponse.json(
        { success: false, error: "Aksi koneksi tidak valid." },
        { status: 400 },
      );
    }
    const connection = await prisma.userConnection.findUnique({
      where: { id: connectionId },
    });
    if (!connection) {
      return NextResponse.json(
        { success: false, error: "Koneksi tidak ditemukan." },
        { status: 404 },
      );
    }
    if (
      action === "accept" &&
      (connection.addresseeId !== user.id ||
        connection.status !== ConnectionStatus.PENDING)
    ) {
      return NextResponse.json(
        { success: false, error: "Permintaan tidak dapat diterima." },
        { status: 403 },
      );
    }
    if (
      action === "block" &&
      connection.requesterId !== user.id &&
      connection.addresseeId !== user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Koneksi bukan milik pengguna." },
        { status: 403 },
      );
    }
    const updated = await prisma.userConnection.update({
      where: { id: connection.id },
      data: {
        status:
          action === "accept"
            ? ConnectionStatus.ACCEPTED
            : ConnectionStatus.BLOCKED,
        blockedById: action === "block" ? user.id : null,
      },
    });
    return NextResponse.json({ success: true, connection: updated });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { connectionId } = await context.params;
    const connection = await prisma.userConnection.findFirst({
      where: {
        id: connectionId,
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      },
    });
    if (!connection) {
      return NextResponse.json(
        { success: false, error: "Koneksi tidak ditemukan." },
        { status: 404 },
      );
    }
    if (
      connection.status === ConnectionStatus.BLOCKED &&
      connection.blockedById !== user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Blokir hanya dapat dibuka oleh pemblokir." },
        { status: 403 },
      );
    }
    await prisma.userConnection.delete({ where: { id: connection.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
