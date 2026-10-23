import type { ReactNode } from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";

/** Centered card layout shared by the login, sign-up and password pages. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-3xl"
      />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2 text-lg font-bold text-white">
          <span className="flex size-9 items-center justify-center rounded-xl bg-violet-600">
            <Ticket aria-hidden="true" className="size-5" />
          </span>
          EventSphere
        </Link>
        <div className="rounded-2xl border border-white/10 bg-navy-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}

type AuthHeadingProps = {
  title: string;
  description?: string;
};

export function AuthHeading({ title, description }: AuthHeadingProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p> : null}
    </div>
  );
}
