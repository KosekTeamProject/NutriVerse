import { Prisma } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class ApiAuthError extends Error {
  constructor(message = "Sesi tidak valid atau telah berakhir.") {
    super(message);
  }
}

function displayName(user: SupabaseUser) {
  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  return user.email?.split("@")[0] ?? "Pengguna NutriVerse";
}

function avatarUrl(user: SupabaseUser) {
  const value = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

const identitySelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  avatarUrl: true,
  role: true,
} satisfies Prisma.UserSelect;

/** Creates the domain profile once and keeps basic identity data in sync with Supabase Auth. */
export async function bootstrapUser(authUser: SupabaseUser) {
  if (!authUser.email) throw new ApiAuthError("Akun autentikasi tidak memiliki alamat email.");
  const email = authUser.email;

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true, authUserId: true },
  });

  if (
    existingByEmail?.authUserId &&
    existingByEmail.authUserId !== authUser.id
  ) {
    throw new ApiAuthError(
      "Email ini sudah terhubung dengan identitas autentikasi lain.",
    );
  }

  if (existingByEmail) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        authUserId: authUser.id,
        email,
        name: displayName(authUser),
        avatarUrl: avatarUrl(authUser),
        healthProfile: { upsert: { create: {}, update: {} } },
        companionPreference: { upsert: { create: {}, update: {} } },
        settings: { upsert: { create: {}, update: {} } },
        economy: { upsert: { create: {}, update: {} } },
      },
      select: identitySelect,
    });
  }

  return prisma.user.upsert({
    where: { authUserId: authUser.id },
    update: {
      email,
      name: displayName(authUser),
      avatarUrl: avatarUrl(authUser),
    },
    create: {
      authUserId: authUser.id,
      email,
      name: displayName(authUser),
      avatarUrl: avatarUrl(authUser),
      healthProfile: { create: {} },
      companionPreference: { create: {} },
      settings: { create: {} },
      economy: { create: {} },
    },
    select: identitySelect,
  });
}

/** Verifies the bearer session against Supabase Auth and resolves the application user. */
export async function requireCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ApiAuthError();
  return bootstrapUser(data.user);
}

export async function requireAdminUser() {
  const user = await requireCurrentUser();
  if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
    throw new ApiAuthError("Akun ini tidak memiliki akses administrator.");
  }
  return user;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
  throw error;
}
