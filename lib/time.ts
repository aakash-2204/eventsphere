/**
 * Current time in milliseconds. Server Components render once per request,
 * so reading the clock there is intentional (e.g. upcoming vs past events).
 */
export function nowMs(): number {
  return Date.now();
}
