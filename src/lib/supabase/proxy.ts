import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getOptionalSupabasePublicConfig } from "@/lib/env";
import { isProtectedAppPath } from "@/server/auth/route-access";

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  return target;
}

/**
 * Refreshes the Supabase cookie when needed and performs an optimistic page
 * guard. API handlers still validate the user independently near data access.
 */
export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getOptionalSupabasePublicConfig();

  // The marketing/public pages should remain available when a developer has
  // not configured Supabase yet. Authentication and protected product routes
  // still require the real project credentials.
  if (!config) {
    if (!isProtectedAppPath(request.nextUrl.pathname)) return response;

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.search = "";
    loginUrl.searchParams.set("auth_error", "supabase_not_configured");
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(loginUrl);
  }

  const { url, publishableKey } = config;

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims && isProtectedAppPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.search = "";
    loginUrl.searchParams.set("auth_error", "session_required");
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return copyResponseCookies(response, NextResponse.redirect(loginUrl));
  }

  return response;
}
