"use client";

import { useActionState } from "react";
import { reviewOrganizerRequestAction } from "@/app/dashboard/actions";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/forms";

export function ReviewRequestButtons({ requestId }: { requestId: string }) {
  const [state, formAction] = useActionState(reviewOrganizerRequestAction, initialFormState);

  return (
    <form action={formAction} className="flex shrink-0 flex-col gap-3">
      <input type="hidden" name="requestId" value={requestId} />
      <div className="flex gap-2">
        <SubmitButton name="decision" value="approve" pendingLabel="Approving…">
          Approve
        </SubmitButton>
        <SubmitButton name="decision" value="reject" pendingLabel="Rejecting…" variant="danger">
          Reject
        </SubmitButton>
      </div>
      {state.status === "error" ? <FormMessage state={state} /> : null}
    </form>
  );
}
