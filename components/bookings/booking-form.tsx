"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { createHoldAction } from "@/lib/bookings/actions";
import { formatPrice } from "@/lib/format";
import { initialFormState } from "@/lib/forms";

type Option = { id: string; name: string; price: number; left: number; onSale: boolean };

/** Ticket type + quantity picker with a live checkout summary. */
export function BookingForm({ eventId, options }: { eventId: string; options: Option[] }) {
  const [state, formAction] = useActionState(createHoldAction, initialFormState);
  const firstAvailable = options.find((option) => option.onSale && option.left > 0);
  const [typeId, setTypeId] = useState(firstAvailable?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const selected = options.find((option) => option.id === typeId);
  const maxQuantity = Math.min(10, selected?.left ?? 1);

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />
      <input type="hidden" name="eventId" value={eventId} />

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium text-slate-200">Ticket type</legend>
        {options.map((option) => {
          const disabled = !option.onSale || option.left === 0;
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                typeId === option.id ? "border-violet-500 bg-violet-500/10" : "border-white/10"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="ticketTypeId"
                  value={option.id}
                  checked={typeId === option.id}
                  disabled={disabled}
                  onChange={() => {
                    setTypeId(option.id);
                    setQuantity(1);
                  }}
                  className="accent-violet-500"
                />
                <span>
                  <span className="block font-medium text-white">{option.name}</span>
                  <span className="text-xs text-slate-400">
                    {!option.onSale ? "Not on sale" : option.left === 0 ? "Sold out" : `${option.left} left`}
                  </span>
                </span>
              </span>
              <span className="font-semibold text-white">{formatPrice(option.price)}</span>
            </label>
          );
        })}
      </fieldset>

      <label className="block text-sm font-medium text-slate-200">
        Quantity
        <select
          name="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          disabled={!selected}
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-navy-950/80 px-4 py-3 text-sm text-white"
        >
          {Array.from({ length: Math.max(maxQuantity, 1) }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-xl border border-white/10 bg-navy-950/60 p-4 text-sm">
        <p className="font-medium text-white">Checkout summary</p>
        <p className="mt-2 flex justify-between text-slate-300">
          <span>
            {quantity} × {selected?.name ?? "—"}
          </span>
          <span>{selected ? formatPrice(selected.price * quantity) : "—"}</span>
        </p>
        <p className="mt-2 text-xs text-slate-500">Seats are held for 10 minutes while you complete the mock payment.</p>
      </div>

      <SubmitButton pendingLabel="Reserving seats…" className="w-full" >
        Continue to payment
      </SubmitButton>
    </form>
  );
}
