import { DeviceType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const devices = await prisma.userDeviceToken.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        deviceType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, devices });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const token = stringValue(body?.token, "Token perangkat", {
      min: 20,
      max: 4_096,
    });
    const deviceType =
      typeof body?.deviceType === "string" &&
      Object.values(DeviceType).includes(body.deviceType as DeviceType)
        ? (body.deviceType as DeviceType)
        : DeviceType.WEB;
    const existing = await prisma.userDeviceToken.findUnique({
      where: { fcmToken: token },
    });
    if (existing && existing.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Token perangkat sudah terhubung ke akun lain." },
        { status: 409 },
      );
    }
    const device = await prisma.userDeviceToken.upsert({
      where: { fcmToken: token },
      create: { userId: user.id, fcmToken: token, deviceType },
      update: { deviceType, updatedAt: new Date() },
      select: {
        id: true,
        deviceType: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ success: true, device }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const deviceId = stringValue(body?.deviceId, "ID perangkat", {
      max: 100,
    });
    const result = await prisma.userDeviceToken.deleteMany({
      where: { id: deviceId, userId: user.id },
    });
    if (!result.count) {
      return NextResponse.json(
        { success: false, error: "Perangkat tidak ditemukan." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
