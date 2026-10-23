// The shape every Server Action form returns, so all forms can show
// errors and success messages the same way.

export type FormState = {
  status: "idle" | "error" | "success";
  /** Message shown above or below the form. */
  message?: string;
  /** Validation errors per field name, e.g. { email: ["Enter a valid email"] } */
  fieldErrors?: Partial<Record<string, string[]>>;
  /** Values to put back in the form after an error (never passwords). */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

/** Reads a text field from FormData, returning "" when it is missing. */
export function getText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * Only allow redirects to pages on this site (e.g. "/dashboard").
 * Blocks values like "https://evil.com" or "//evil.com" (open redirects).
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
