"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { signUpAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/forms";

export function SignupForm() {
  const [state, formAction] = useActionState(signUpAction, initialFormState);

  // After sign-up, replace the form with a "check your inbox" message.
  if (state.status === "success") {
    return (
      <div role="status" className="text-center">
        <MailCheck aria-hidden="true" className="mx-auto size-12 text-emerald-300" />
        <h2 className="mt-4 text-lg font-semibold text-white">Verify your email</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{state.message}</p>
        <p className="mt-4 text-xs text-slate-500">Didn&apos;t get it? Check your spam folder.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage state={state} />

      <FormField
        label="Full name"
        name="fullName"
        autoComplete="name"
        required
        defaultValue={state.values?.fullName}
        errors={state.fieldErrors?.fullName}
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters, with a letter and a number."
        errors={state.fieldErrors?.password}
      />
      <FormField
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirmPassword}
      />

      <p className="text-xs leading-5 text-slate-500">
        New accounts start as attendees. You can request organizer access from your dashboard.
      </p>

      <SubmitButton pendingLabel="Creating account…" className="w-full">
        Create account
      </SubmitButton>
    </form>
  );
}
