// Server Component: shows "Log In / Sign Up" to guests and "Dashboard" to
// signed-in users. It reads the session, so it must be rendered inside
// <Suspense> — the fallback is the guest version.

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";

type Layout = "desktop" | "mobile";

const linkClasses: Record<Layout, { ghost: string; primary: string }> = {
  desktop: {
    ghost: "rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white",
    primary: "rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500",
  },
  mobile: {
    ghost: "rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white",
    primary: "rounded-lg bg-violet-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-violet-500",
  },
};

export function GuestAuthLinks({ layout }: { layout: Layout }) {
  const classes = linkClasses[layout];
  return (
    <>
      <Link href="/login" className={classes.ghost}>
        Log In
      </Link>
      <Link href="/signup" className={classes.primary}>
        Sign Up
      </Link>
    </>
  );
}

export async function HeaderAuthLinks({ layout }: { layout: Layout }) {
  const user = await getCurrentUser();
  if (!user) return <GuestAuthLinks layout={layout} />;

  return (
    <Link href="/dashboard" className={`inline-flex items-center gap-2 ${linkClasses[layout].primary}`}>
      <LayoutDashboard aria-hidden="true" className="size-4" />
      Dashboard
    </Link>
  );
}
