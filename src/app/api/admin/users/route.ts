import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireSystemAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireSystemAdmin();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().slice(0, 100);
    const roleValue = searchParams.get("role");
    const role =
      roleValue &&
      Object.values(UserRole).includes(roleValue as UserRole)
        ? (roleValue as UserRole)
        : undefined;
    const suspendedValue = searchParams.get("suspended");
    const isSuspended =
      suspendedValue === "true"
        ? true
        : suspendedValue === "false"
          ? false
          : undefined;
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 100, 1),
      250,
    );
    const users = await prisma.user.findMany({
      where: {
        role,
        isSuspended,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { username: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        authUserId: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        role: true,
        isSuspended: true,
        suspendedAt: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
        economy: {
          select: {
            totalXp: true,
            currentHp: true,
            hpDebt: true,
            currentTier: true,
          },
        },
        _count: {
          select: {
            activitySessions: true,
            reportsSubmitted: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
