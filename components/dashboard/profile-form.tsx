"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/dashboard/actions";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/forms";

/** Lets a user change their display name. The role cannot be edited here. */
export function ProfileForm({ fullName }: { fullName: string }) {
  const [state, formAction] = useActionState(updateProfileAction, initialFormState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <FormField
        label="Full name"
        name="fullName"
        autoComplete="name"
        required
        defaultValue={state.values?.fullName ?? fullName}
        errors={state.fieldErrors?.fullName}
      />
      <SubmitButton pendingLabel="Saving…" variant="secondary">
        Save name
      </SubmitButton>
    </form>
  );
}
