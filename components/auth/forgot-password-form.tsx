"use client";

import { useActionState } from "react";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/forms";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialFormState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage state={state} />

      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />

      <SubmitButton pendingLabel="Sending link…" className="w-full">
        Send reset link
      </SubmitButton>
    </form>
  );
}
