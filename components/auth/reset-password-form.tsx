"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { resetPasswordAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/forms";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initialFormState);

  if (state.status === "success") {
    return (
      <div className="space-y-5">
        <FormMessage state={state} />
        <Link
          href="/dashboard"
          className="flex w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage state={state} />

      <FormField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters, with a letter and a number."
        errors={state.fieldErrors?.password}
      />
      <FormField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirmPassword}
      />

      <SubmitButton pendingLabel="Saving…" className="w-full">
        Update password
      </SubmitButton>
    </form>
  );
}
