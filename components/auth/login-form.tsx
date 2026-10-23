"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { signInAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/forms";

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initialFormState);
  // Where to go after logging in, e.g. /login?next=/dashboard.
  // The server re-checks this value, so it cannot redirect to another site.
  const next = useSearchParams().get("next") ?? "/dashboard";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next} />

      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />

      <div className="space-y-2">
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          errors={state.fieldErrors?.password}
        />
        <p className="text-right text-sm">
          <Link href="/forgot-password" className="text-violet-300 hover:text-violet-200">
            Forgot password?
          </Link>
        </p>
      </div>

      <SubmitButton pendingLabel="Logging in…" className="w-full">
        Log in
      </SubmitButton>
    </form>
  );
}
