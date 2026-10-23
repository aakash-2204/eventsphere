type ComingSoonButtonProps = {
  label: string;
  variant?: "primary" | "ghost";
  className?: string;
};

const variantClasses = {
  primary: "bg-violet-600/40 text-violet-100",
  ghost: "text-slate-400",
};

/**
 * Placeholder for a feature that does not exist yet (e.g. Log In, Sign Up).
 * It is a disabled button rather than a link, so it never sends the user to
 * a page that does not exist.
 */
export function ComingSoonButton({ label, variant = "ghost", className = "" }: ComingSoonButtonProps) {
  return (
    <button
      type="button"
      disabled
      title={`${label} is coming in a later phase`}
      className={`inline-flex cursor-not-allowed items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${variantClasses[variant]} ${className}`}
    >
      {label}
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Soon
      </span>
    </button>
  );
}
