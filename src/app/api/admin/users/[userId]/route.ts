import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  stringValue,
} from "@/lib/api";
import { requireSystemAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ userId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireSystemAdmin();
    const { userId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isSuspended: true,
        suspendedAt: true,
        suspensionReason: true,
      },
    });
    if (!existing) {
      throw new ApiRequestError("Pengguna tidak ditemukan.", 404);
    }
    const role =
      body?.role === undefined
        ? undefined
        : typeof body.role === "string" &&
            Object.values(UserRole).includes(body.role as UserRole)
          ? (body.role as UserRole)
          : null;
    if (role === null) {
      throw new ApiRequestError("Role pengguna tidak valid.");
    }
    const isSuspended =
      body?.isSuspended === undefined
        ? undefined
        : typeof body.isSuspended === "boolean"
          ? body.isSuspended
          : null;
    if (isSuspended === null) {
      throw new ApiRequestError("Status suspend tidak valid.");
    }
    if (
      existing.id === admin.id &&
      (isSuspended === true || (role && role !== UserRole.ADMIN))
    ) {
      throw new ApiRequestError(
        "Administrator tidak dapat menonaktifkan atau menurunkan role akunnya sendiri.",
        409,
      );
    }
    const reason =
      body?.reason === undefined
        ? undefined
        : stringValue(body.reason, "Alasan", { min: 5, max: 500 });
    if (isSuspended === true && !reason) {
      throw new ApiRequestError("Alasan suspend wajib diisi.");
    }
    if (role === undefined && isSuspended === undefined) {
      throw new ApiRequestError("Tidak ada perubahan yang diberikan.");
    }

    const user = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.user.update({
        where: { id: existing.id },
        data: {
          role,
          isSuspended,
          suspendedAt:
            isSuspended === true
              ? new Date()
              : isSuspended === false
                ? null
                : undefined,
          suspensionReason:
            isSuspended === true
              ? reason
              : isSuspended === false
                ? null
                : undefined,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isSuspended: true,
          suspendedAt: true,
          suspensionReason: true,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "UPDATE_USER_ACCESS",
          entityName: "User",
          entityId: existing.id,
          beforeState: existing,
          afterState: updated,
          reason,
        },
      });
      return updated;
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
