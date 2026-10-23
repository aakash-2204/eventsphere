"use client";

import { useActionState } from "react";
import { requestOrganizerAccessAction } from "@/app/dashboard/actions";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/forms";

export function OrganizerRequestForm() {
  const [state, formAction] = useActionState(requestOrganizerAccessAction, initialFormState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <FormField
        label="Organization name"
        name="organizationName"
        required
        defaultValue={state.values?.organizationName}
        errors={state.fieldErrors?.organizationName}
      />
      <FormField
        label="What events do you plan to host?"
        name="reason"
        multiline
        required
        hint="At least 20 characters."
        defaultValue={state.values?.reason}
        errors={state.fieldErrors?.reason}
      />
      <SubmitButton pendingLabel="Sending…">Request organizer access</SubmitButton>
    </form>
  );
}
