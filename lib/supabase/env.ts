// Reads the public Supabase settings from environment variables.
//
// Both values are safe to expose to the browser: the publishable (anon) key
// only allows what Row Level Security policies allow. NEVER add the
// service-role / secret key here or give it a NEXT_PUBLIC_ prefix.

// Written out in full (not process.env[name]) so Next.js can inline them
// into browser code at build time.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** True when both Supabase variables are filled in (see .env.example). */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabaseEnv(): { url: string; publishableKey: string } {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and fill in " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see SUPABASE_SETUP.md).",
    );
  }
  return { url: supabaseUrl, publishableKey: supabasePublishableKey };
}
