const tones: Record<string, string> = {
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  amber: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  red: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  violet: "border-violet-500/40 bg-violet-500/10 text-violet-200",
  slate: "border-white/15 bg-white/5 text-slate-300",
};

const statusTone: Record<string, keyof typeof tones> = {
  published: "green",
  approved: "green",
  confirmed: "green",
  valid: "green",
  checked_in: "violet",
  pending: "amber",
  held: "amber",
  draft: "slate",
  not_submitted: "slate",
  rejected: "red",
  cancelled: "red",
  expired: "slate",
};

const labels: Record<string, string> = {
  not_submitted: "not submitted",
  checked_in: "checked in",
  pending: "pending approval",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = tones[statusTone[status] ?? "slate"];
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
      {labels[status] ?? status}
    </span>
  );
}
