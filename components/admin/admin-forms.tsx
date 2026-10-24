"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { reviewEventAction, setUserRoleAction } from "@/lib/admin/actions";
import { initialFormState } from "@/lib/forms";

export function ReviewEventForm({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState(reviewEventAction, initialFormState);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={formAction} className="space-y-3">
      <FormMessage state={state} />
      <input type="hidden" name="eventId" value={eventId} />
      <label className="block text-sm text-slate-300">
        Note to organizer (required when rejecting)
        <input name="note" className="mt-1 w-full rounded-xl border border-white/10 bg-navy-950/80 px-3 py-2 text-sm text-white" />
      </label>
      <div className="flex gap-2">
        <SubmitButton name="decision" value="approve" pendingLabel="Approving…">Approve & publish</SubmitButton>
        <SubmitButton name="decision" value="reject" pendingLabel="Rejecting…" variant="danger">Reject</SubmitButton>
      </div>
    </form>
  );
}

export function RoleForm({ userId, role }: { userId: string; role: "attendee" | "organizer" }) {
  const [state, formAction] = useActionState(setUserRoleAction, initialFormState);
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Change this user's role?")) event.preventDefault();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={role === "attendee" ? "organizer" : "attendee"} />
      <SubmitButton pendingLabel="Saving…" variant="secondary" className="px-3! py-1.5!">
        {role === "attendee" ? "Make organizer" : "Make attendee"}
      </SubmitButton>
      {state.status === "error" ? <span className="text-xs text-rose-300">{state.message}</span> : null}
    </form>
  );
}
