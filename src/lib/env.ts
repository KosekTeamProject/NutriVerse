function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getOptionalSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url && !publishableKey) return null;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase configuration is incomplete. Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, publishableKey } as const;
}

export function getSupabasePublicConfig() {
  return {
    url: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  } as const;
}
