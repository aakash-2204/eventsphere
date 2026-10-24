"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/dashboard/actions";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/forms";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initialFormState);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <FormField label="Current password" name="currentPassword" type="password" autoComplete="current-password" errors={errors.currentPassword} />
      <FormField label="New password" name="password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." errors={errors.password} />
      <FormField label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" errors={errors.confirmPassword} />
      <SubmitButton pendingLabel="Saving…" variant="secondary">Change password</SubmitButton>
    </form>
  );
}
