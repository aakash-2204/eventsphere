// Data Access Layer: the ONE place that decides who the current user is and
// what they are allowed to see. Protected pages and Server Actions call these
// functions on the server. Hiding a button in the UI is never the only check.

import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/types/database";

export type CurrentUser = {
  id: string;
  email: string;
  /** null only if the database migration has not been run yet. */
  profile: Profile | null;
};

/**
 * Returns the signed-in user, or null for guests.
 * `cache` makes repeated calls in the same request reuse one lookup.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  // getClaims() verifies the session token's signature, unlike getSession(),
  // which just trusts the cookie.
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  const userId = data.claims.sub;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  return {
    id: userId,
    email: typeof data.claims.email === "string" ? data.claims.email : "",
    profile,
  };
});

/** Use at the top of protected pages. Guests are sent to the login page. */
export async function requireUser(returnTo = "/dashboard"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  return user;
}

/** Use for role-specific pages. Users without the role go back to /dashboard. */
export async function requireRole(
  allowedRoles: AppRole[],
  returnTo = "/dashboard",
): Promise<CurrentUser & { profile: Profile }> {
  const user = await requireUser(returnTo);
  const profile = user.profile;
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect("/dashboard");
  }
  return { ...user, profile };
}
