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
  name: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

function missingAuthIdentityColumn(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022"
  ) {
    return true;
  }

  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2022"
  );
}

async function bootstrapLegacyUser(authUser: SupabaseUser) {
  const email = authUser.email!;
  const name = displayName(authUser);
  const avatar = avatarUrl(authUser);
  const users = await prisma.$queryRaw<
    Array<{ id: string; email: string; name: string; avatarUrl: string | null }>
  >(Prisma.sql`
    INSERT INTO "users" ("id", "email", "name", "avatarUrl", "createdAt", "updatedAt")
    VALUES (${authUser.id}, ${email}, ${name}, ${avatar}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("email") DO UPDATE
      SET "name" = EXCLUDED."name",
          "avatarUrl" = EXCLUDED."avatarUrl",
          "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "id", "email", "name", "avatarUrl"
  `);

  const user = users[0];
  if (!user) throw new ApiAuthError("Profil pengguna gagal dibuat.");
  return user;
}

/** Creates the domain profile once and keeps basic identity data in sync with Supabase Auth. */
export async function bootstrapUser(authUser: SupabaseUser) {
  if (!authUser.email) throw new ApiAuthError("Akun autentikasi tidak memiliki alamat email.");

  try {
    return await prisma.user.upsert({
      where: { authUserId: authUser.id },
      update: {
        email: authUser.email,
        name: displayName(authUser),
        avatarUrl: avatarUrl(authUser),
      },
      create: {
        authUserId: authUser.id,
        email: authUser.email,
        name: displayName(authUser),
        avatarUrl: avatarUrl(authUser),
        healthProfile: { create: {} },
        companionPreference: { create: {} },
        settings: { create: {} },
        economy: { create: {} },
      },
      select: identitySelect,
    });
  } catch (error) {
    if (!missingAuthIdentityColumn(error)) throw error;

    // Temporary compatibility for the shared database until the pending
    // Supabase identity migration is reconciled and applied by the team.
    return bootstrapLegacyUser(authUser);
  }
}

/** Verifies the bearer session against Supabase Auth and resolves the application user. */
export async function requireCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ApiAuthError();
  return bootstrapUser(data.user);
}

export function authErrorResponse(error: unknown) {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
  throw error;
}
