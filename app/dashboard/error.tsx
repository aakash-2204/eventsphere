"use client";

// Shown if something unexpected fails while loading the dashboard
// (for example, the database is unreachable).

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 text-center">
      <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-400">
        We couldn&apos;t load your dashboard. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500"
      >
        Try again
      </button>
    </div>
  );
}
