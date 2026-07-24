import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  finiteNumber,
  stringValue,
} from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ eventId: string }> };

function optionalDate(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { eventId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Event tidak ditemukan." },
        { status: 404 },
      );
    }
    const startDate = optionalDate(body?.startDate);
    const endDate = optionalDate(body?.endDate);
    if (startDate === null || endDate === null) {
      return NextResponse.json(
        { success: false, error: "Tanggal event tidak valid." },
        { status: 400 },
      );
    }
    const finalStart = startDate ?? existing.startDate;
    const finalEnd = endDate ?? existing.endDate;
    if (finalEnd <= finalStart) {
      return NextResponse.json(
        { success: false, error: "Rentang tanggal event tidak valid." },
        { status: 400 },
      );
    }
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(body?.title !== undefined
          ? {
              title: stringValue(body.title, "Judul", {
                min: 3,
                max: 150,
              }),
            }
          : {}),
        ...(body?.description !== undefined
          ? {
              description: stringValue(body.description, "Deskripsi", {
                min: 10,
                max: 2_000,
              }),
            }
          : {}),
        ...(body?.bannerUrl !== undefined
          ? {
              bannerUrl: stringValue(body.bannerUrl, "Banner URL", {
                max: 2_000,
              }),
            }
          : {}),
        ...(body?.location !== undefined
          ? {
              location:
                body.location === null || body.location === ""
                  ? null
                  : stringValue(body.location, "Lokasi", { max: 200 }),
            }
          : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(body?.capacity !== undefined
          ? {
              capacity: Math.round(
                finiteNumber(body.capacity, "Kapasitas", {
                  min: 0,
                  max: 1_000_000,
                }),
              ),
            }
          : {}),
        ...(body?.isActive !== undefined
          ? { isActive: body.isActive === true }
          : {}),
      },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "UPDATE_EVENT",
        entityName: "Event",
        entityId: event.id,
        beforeState: existing,
        afterState: event,
      },
    });
    return NextResponse.json({ success: true, event });
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
    const admin = await requireAdminUser();
    const { eventId } = await context.params;
    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Event tidak ditemukan." },
        { status: 404 },
      );
    }
    const event = await prisma.event.update({
      where: { id: eventId },
      data: { isActive: false },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "ARCHIVE_EVENT",
        entityName: "Event",
        entityId: event.id,
        beforeState: existing,
        afterState: event,
      },
    });
    return NextResponse.json({ success: true, event });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
