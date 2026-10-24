// TEMPORARY production diagnostics for auth failures.
// Remove this file (and its calls) once the Vercel signup issue is fixed,
// because the assignment does not allow console logging in finished code.
//
// Logs only safe technical facts. It never logs passwords, emails, tokens,
// cookies, keys or environment-variable values — only yes/no checks about them.

type AuthLikeError = {
  name?: unknown;
  code?: unknown;
  status?: unknown;
  message?: unknown;
  cause?: unknown;
};

/**
 * Removes anything that could identify a user or leak a secret, then shortens it.
 * `knownSecrets` are the exact values the user submitted (email, password, name),
 * removed first so they can never appear even inside an unexpected message.
 */
function sanitize(text: string, knownSecrets: string[]): string {
  let result = text;
  for (const secret of knownSecrets) {
    if (secret) result = result.split(secret).join("[redacted]").split(secret.toLowerCase()).join("[redacted]");
  }
  return result
    .replace(/[^\s@"']+@[^\s@"']+/g, "[email]")
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[jwt]")
    .replace(/sb_(publishable|secret)_[\w-]+/g, "[key]")
    .replace(/https?:\/\/\S+/g, "[url]")
    .replace(/\b[\w-]+\.supabase\.(co|in)\b/g, "[host]")
    .replace(/\bBearer\s+\S+/gi, "Bearer [token]")
    .replace(/\b[\w.-]+=[^\s;,]+/g, "[name=value]")
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, "[token]")
    .slice(0, 200);
}

/** Error names and codes are short identifiers; anything else is replaced. */
function safeIdentifier(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return /^[A-Za-z0-9_.-]{1,64}$/.test(value) ? value : "[unexpected]";
}

/** Yes/no facts about the configuration. No values are included. */
function describeConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  let urlIsHttpsSupabase = false;
  let urlHasExtraPath = false;
  try {
    const parsed = new URL(url);
    urlIsHttpsSupabase = parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
    urlHasExtraPath = parsed.pathname !== "/" && parsed.pathname !== "";
  } catch {
    // Not a valid URL; urlIsHttpsSupabase stays false.
  }

  const keyKind = !key
    ? "missing"
    : key.startsWith("sb_publishable_")
      ? "publishable"
      : key.startsWith("sb_secret_")
        ? "SECRET_KEY_WRONG_TYPE"
        : key.startsWith("eyJ")
          ? "legacy_jwt"
          : "unrecognized";

  return {
    urlSet: url.length > 0,
    urlIsHttpsSupabase,
    urlHasExtraPath,
    urlHasSpacesOrQuotes: /[\s"']/.test(url),
    keyKind,
    keyHasSpacesOrQuotes: /[\s"']/.test(key),
    siteUrlSet: siteUrl.length > 0,
    siteUrlIsLocalhost: /localhost|127\.0\.0\.1/.test(siteUrl),
    siteUrlIsHttps: siteUrl.startsWith("https://"),
    // Only the deployment type, from a fixed list (never a free-form value).
    deployment: ["production", "preview", "development"].includes(process.env.VERCEL_ENV ?? "")
      ? process.env.VERCEL_ENV
      : "not-vercel",
  };
}

export function logAuthFailure(stage: string, error: unknown, knownSecrets: string[] = []): void {
  const err = (typeof error === "object" && error !== null ? error : {}) as AuthLikeError;
  const cause = (typeof err.cause === "object" && err.cause !== null ? err.cause : {}) as AuthLikeError;

  console.error("[auth-diagnostic]", {
    stage,
    name: safeIdentifier(err.name) ?? typeof error,
    code: safeIdentifier(err.code),
    status: typeof err.status === "number" ? err.status : undefined,
    message: typeof err.message === "string" ? sanitize(err.message, knownSecrets) : undefined,
    causeCode: safeIdentifier(cause.code),
    config: describeConfig(),
  });
}
