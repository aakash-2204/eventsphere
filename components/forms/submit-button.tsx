"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  /** Lets one form have several submit buttons (e.g. Approve / Reject). */
  name?: string;
  value?: string;
};

const variantClasses = {
  primary: "bg-violet-600 text-white hover:bg-violet-500",
  secondary: "border border-white/15 text-slate-200 hover:border-white/30 hover:bg-white/5",
  danger: "border border-rose-500/40 text-rose-200 hover:bg-rose-500/10",
};

/** Submit button that disables itself and shows a spinner while the form is sending. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className = "",
  name,
  value,
}: SubmitButtonProps) {
  const { pending, data } = useFormStatus();
  // With several buttons in one form, only the one that was clicked shows the spinner.
  const isThisButtonPending = pending && (!name || data?.get(name) === value);

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
    >
      {isThisButtonPending ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
