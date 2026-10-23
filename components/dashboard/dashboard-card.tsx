import type { ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function DashboardCard({ title, description, children }: DashboardCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-navy-900/70 p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {description ? <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
