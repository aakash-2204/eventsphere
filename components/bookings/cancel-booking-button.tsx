"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { cancelBookingAction } from "@/lib/bookings/actions";
import { initialFormState } from "@/lib/forms";

/** Cancel button with a confirmation dialog. The server re-checks every rule. */
export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [state, formAction] = useActionState(cancelBookingAction, initialFormState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Cancel this booking? All its tickets will stop working. This is a mock payment, so no refund is involved.")) {
          event.preventDefault();
        }
      }}
      className="space-y-3"
    >
      <FormMessage state={state} />
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.status !== "success" ? (
        <SubmitButton pendingLabel="Cancelling…" variant="danger">
          Cancel booking
        </SubmitButton>
      ) : null}
    </form>
  );
}
