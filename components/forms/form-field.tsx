import type { InputHTMLAttributes } from "react";

type FormFieldProps = {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
  /** Render a multi-line textarea instead of an input. */
  multiline?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement & HTMLTextAreaElement>, "name">;

const baseClasses =
  "w-full rounded-xl border bg-navy-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2";

/** A labelled input that shows validation errors underneath it. */
export function FormField({ label, name, errors, hint, multiline = false, ...inputProps }: FormFieldProps) {
  const id = inputProps.id ?? `field-${name}`;
  const hasError = Boolean(errors?.length);
  const describedBy = [hint ? `${id}-hint` : null, hasError ? `${id}-error` : null].filter(Boolean).join(" ");
  const stateClasses = hasError
    ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30"
    : "border-white/10 focus:border-violet-500 focus:ring-violet-500/40";

  const sharedProps = {
    ...inputProps,
    id,
    name,
    "aria-invalid": hasError || undefined,
    "aria-describedby": describedBy || undefined,
    className: `${baseClasses} ${stateClasses}`,
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-200">
        {label}
      </label>
      {multiline ? <textarea rows={4} {...sharedProps} /> : <input {...sharedProps} />}
      {hint && !hasError ? (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {hasError ? (
        <p id={`${id}-error`} className="text-xs text-rose-300">
          {errors?.[0]}
        </p>
      ) : null}
    </div>
  );
}
