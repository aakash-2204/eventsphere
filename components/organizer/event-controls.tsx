"use client";

import { useActionState } from "react";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/forms";
import { addTicketTypeAction, cancelEventAction, submitEventAction } from "@/lib/organizer/actions";

export function TicketTypeForm({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState(addTicketTypeAction, initialFormState);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="eventId" value={eventId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Name" name="name" placeholder="General Admission" defaultValue={state.values?.name} errors={errors.name} />
        <FormField label="Price (₹)" name="price" type="number" min={0} step="1" defaultValue={state.values?.price ?? "0"} errors={errors.price} />
        <FormField label="Quantity" name="quantity" type="number" min={1} defaultValue={state.values?.quantity ?? "100"} errors={errors.quantity} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Sale starts (optional)" name="saleStartsAt" type="datetime-local" defaultValue={state.values?.saleStartsAt} errors={errors.saleStartsAt} />
        <FormField label="Sale ends (optional)" name="saleEndsAt" type="datetime-local" defaultValue={state.values?.saleEndsAt} errors={errors.saleEndsAt} />
      </div>
      <SubmitButton pendingLabel="Adding…" variant="secondary">Add ticket type</SubmitButton>
    </form>
  );
}

export function SubmitForReviewButton({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState(submitEventAction, initialFormState);
  return (
    <form action={formAction} className="space-y-3">
      <FormMessage state={state} />
      <input type="hidden" name="eventId" value={eventId} />
      {state.status !== "success" ? <SubmitButton pendingLabel="Submitting…">Submit for admin approval</SubmitButton> : null}
    </form>
  );
}

export function CancelEventForm({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState(cancelEventAction, initialFormState);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Cancel this event? All bookings and tickets will be cancelled and attendees notified. This cannot be undone.")) {
          event.preventDefault();
        }
      }}
      className="space-y-3"
    >
      <FormMessage state={state} />
      <input type="hidden" name="eventId" value={eventId} />
      <FormField label="Reason shown to attendees (optional)" name="reason" />
      <SubmitButton pendingLabel="Cancelling…" variant="danger">Cancel event</SubmitButton>
    </form>
  );
}
