"use client";

import { useActionState, useEffect, useState } from "react";
import { CreditCard, ShieldAlert, Smartphone } from "lucide-react";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { confirmPaymentAction, failPaymentAction } from "@/lib/bookings/actions";
import { initialFormState } from "@/lib/forms";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-navy-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500";

/**
 * MOCK payment screen. The card / UPI inputs below have no `name` attribute,
 * so the browser never sends them to the server and nothing is stored.
 * Only the chosen method ("card" or "upi") is submitted.
 */
export function MockPaymentForm({ bookingId, expiresAt }: { bookingId: string; expiresAt: string }) {
  const [state, formAction] = useActionState(confirmPaymentAction, initialFormState);
  const [method, setMethod] = useState<"card" | "upi">("card");
  const secondsLeft = useCountdown(expiresAt);
  const expired = secondsLeft <= 0;

  return (
    <div className="space-y-5">
      <p className={`rounded-xl border px-4 py-3 text-sm ${expired ? "border-rose-500/40 bg-rose-500/10 text-rose-100" : "border-amber-500/40 bg-amber-500/10 text-amber-100"}`} aria-live="polite">
        {expired
          ? "Your hold has expired. The server will release these seats."
          : `Seats held for ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`}
      </p>

      <p className="flex gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Mock payment — this is a simulation. No money is charged and no card or UPI details are stored or sent.
      </p>

      <form action={formAction} className="space-y-4">
        <FormMessage state={state} />
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="method" value={method} />

        <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-2 gap-2">
          {(["card", "upi"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={method === option}
              onClick={() => setMethod(option)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                method === option ? "border-violet-500 bg-violet-500/10 text-white" : "border-white/10 text-slate-300"
              }`}
            >
              {option === "card" ? <CreditCard aria-hidden="true" className="size-4" /> : <Smartphone aria-hidden="true" className="size-4" />}
              {option === "card" ? "Card" : "UPI"}
            </button>
          ))}
        </div>

        {method === "card" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2 text-sm text-slate-300">
              Card number (any fake number)
              <input inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" className={`${inputClass} mt-1`} />
            </label>
            <label className="text-sm text-slate-300">
              Expiry
              <input autoComplete="off" placeholder="12/30" className={`${inputClass} mt-1`} />
            </label>
            <label className="text-sm text-slate-300">
              CVV
              <input autoComplete="off" placeholder="123" className={`${inputClass} mt-1`} />
            </label>
          </div>
        ) : (
          <label className="block text-sm text-slate-300">
            UPI ID (any fake ID)
            <input autoComplete="off" placeholder="name@mockupi" className={`${inputClass} mt-1`} />
          </label>
        )}

        <SubmitButton pendingLabel="Processing payment…" className="w-full">
          Pay now (simulated)
        </SubmitButton>
      </form>

      <form action={failPaymentAction}>
        <input type="hidden" name="bookingId" value={bookingId} />
        <SubmitButton pendingLabel="Simulating failure…" variant="danger" className="w-full">
          Simulate failed payment
        </SubmitButton>
      </form>
    </div>
  );
}

function useCountdown(expiresAt: string): number {
  const target = new Date(expiresAt).getTime();
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(Math.round((target - Date.now()) / 1000), 0));
  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(Math.max(Math.round((target - Date.now()) / 1000), 0)), 1000);
    return () => clearInterval(timer);
  }, [target]);
  return secondsLeft;
}
