// Formatting helpers. The time zone and locale are fixed so the server and the
// browser always produce the same text (avoids React hydration mismatches).

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatEventDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

export function formatPrice(amount: number): string {
  return amount === 0 ? "Free" : priceFormatter.format(amount);
}
