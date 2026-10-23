// Runs before every page request (called from /proxy.ts).
//
// 1. Refreshes the user's Supabase session and writes updated cookies.
// 2. Does a quick, optimistic redirect for protected pages. This is only a
//    convenience: every protected page and Server Action ALSO checks the user
//    on the server (lib/auth/dal.ts), so skipping this file never exposes data.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseEnv, isSupabaseConfigured } from "./env";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];
const GUEST_ONLY_PATHS = ["/login", "/signup", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  // Before Supabase is configured, let every request through unchanged so the
  // landing page still works.
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  const { url, publishableKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // No-cache headers so a CDN never serves one user's session to another.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Important: call this before anything else so expired tokens are refreshed.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isSignedIn && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return redirectWithCookies(loginUrl, response);
  }

  if (isSignedIn && GUEST_ONLY_PATHS.includes(pathname)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return redirectWithCookies(dashboardUrl, response);
  }

  return response;
}

/** Redirect while keeping any refreshed session cookies and no-cache headers. */
function redirectWithCookies(destination: URL, sessionResponse: NextResponse) {
  const redirect = NextResponse.redirect(destination);
  sessionResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  for (const header of ["Cache-Control", "Expires", "Pragma"]) {
    const value = sessionResponse.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}
