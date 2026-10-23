import type { AppRole } from "@/types/database";

const roleStyles: Record<AppRole, string> = {
  attendee: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  organizer: "border-violet-500/40 bg-violet-500/10 text-violet-200",
  admin: "border-amber-500/40 bg-amber-500/10 text-amber-200",
};

export function RoleBadge({ role }: { role: AppRole }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${roleStyles[role]}`}>
      {role}
    </span>
  );
}
