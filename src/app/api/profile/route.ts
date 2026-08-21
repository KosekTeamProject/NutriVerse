import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedPublicStorageUrl } from "@/lib/storage-ownership";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, username: true, name: true, bio: true, avatarUrl: true,
        createdAt: true, healthProfile: true, companionPreference: true, economy: true,
        badges: { include: { badge: true }, orderBy: { earnedAt: "desc" } },
      },
    });
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ success: false, error: "Payload tidak valid." }, { status: 400 });
    const username =
      body.username !== undefined
        ? stringValue(body.username, "Username", { min: 3, max: 30 }).toLowerCase()
        : undefined;
    if (username !== undefined && !/^[a-z0-9._-]+$/.test(username)) {
      throw new ApiRequestError(
        "Username hanya boleh memakai huruf, angka, titik, garis bawah, dan tanda hubung.",
        400,
        "INVALID_USERNAME",
      );
    }
    let usernameChanged = false;
    if (username !== undefined && username !== user.username) {
      const duplicate = await prisma.user.findFirst({ where: { id: { not: user.id }, username: { equals: username, mode: "insensitive" } }, select: { id: true } });
      if (duplicate) throw new ApiRequestError("Username tersebut sudah digunakan pengguna lain.", 409, "USERNAME_TAKEN");
      const current = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { usernameUpdatedAt: true } });
      if (current.usernameUpdatedAt && current.usernameUpdatedAt.getTime() + 30 * 24 * 60 * 60_000 > Date.now()) {
        throw new ApiRequestError("Username hanya dapat diganti satu kali setiap 30 hari.", 429, "USERNAME_CHANGE_COOLDOWN");
      }
      usernameChanged = true;
    }
    const avatarUrl =
      body.avatarUrl === undefined || body.avatarUrl === ""
        ? body.avatarUrl
        : ownedPublicStorageUrl(body.avatarUrl, user.authUserId, [
            "avatars",
          ]);
    if (body.avatarUrl !== undefined && body.avatarUrl !== "" && !avatarUrl) {
      throw new ApiRequestError(
        "Avatar harus berasal dari upload milik pengguna.",
        400,
        "INVALID_AVATAR_URL",
      );
    }
    const profile = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.user.update({
        where: { id: user.id },
        data: {
        ...(body.name !== undefined ? { name: stringValue(body.name, "Nama", { min: 2, max: 100 }) } : {}),
        ...(username !== undefined ? { username, ...(usernameChanged ? { usernameUpdatedAt: new Date() } : {}) } : {}),
        ...(body.bio !== undefined
          ? { bio: body.bio === "" ? null : stringValue(body.bio, "Bio", { max: 300 }) }
          : {}),
        ...(avatarUrl !== undefined
          ? { avatarUrl: avatarUrl === "" ? null : avatarUrl }
          : {}),
        },
        select: { id: true, email: true, username: true, name: true, bio: true, avatarUrl: true },
      });
      if (body.companionName !== undefined) {
        const companionName = stringValue(body.companionName, "Nama companion", { min: 2, max: 30 });
        await transaction.companionPreference.upsert({
          where: { userId: user.id },
          create: { userId: user.id, companionName },
          update: { companionName },
        });
      }
      return updated;
    });
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiErrorResponse(
        new ApiRequestError(
          "Username tersebut sudah digunakan pengguna lain.",
          409,
          "USERNAME_TAKEN",
        ),
      );
    }
    return apiErrorResponse(error);
  }
}
