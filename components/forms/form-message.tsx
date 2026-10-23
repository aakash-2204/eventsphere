import { CircleAlert, CircleCheck } from "lucide-react";
import type { FormState } from "@/lib/forms";

/** Shows the success or error message returned by a Server Action. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;

  const isError = state.status === "error";
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${
        isError
          ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
      }`}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p>{state.message}</p>
    </div>
  );
}
