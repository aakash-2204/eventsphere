import { TriangleAlert } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Warns developers when .env.local is missing, instead of failing silently. */
export function SupabaseNotConfigured() {
  if (isSupabaseConfigured()) return null;

  return (
    <div role="note" className="mb-6 flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p>
        Supabase is not connected yet, so this form cannot work. Follow{" "}
        <code className="rounded bg-black/30 px-1">SUPABASE_SETUP.md</code> to add your project
        keys, then restart the dev server.
      </p>
    </div>
  );
}
