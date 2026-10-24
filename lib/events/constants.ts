import { sampleCategories } from "@/lib/sample-data/events";

/** Category ids and names. The database check constraint uses the same ids. */
export const categories = sampleCategories.map(({ id, name }) => ({ id, name }));

export function categoryName(id: string): string {
  return categories.find((category) => category.id === id)?.name ?? id;
}

/** Tickets left for sale = quantity minus sold minus currently held. */
export function remaining(type: { quantity: number; sold: number; held: number }): number {
  return Math.max(type.quantity - type.sold - type.held, 0);
}

/** Supabase errors from our database functions carry a readable message. */
export function dbMessage(error: { message?: string } | null, fallback: string): string {
  const message = error?.message ?? "";
  // Only pass through the friendly messages we raise ourselves in SQL.
  return /^[A-Z][^\n]{3,120}$/.test(message) && !/violates|permission|syntax|relation|column/i.test(message)
    ? message
    : fallback;
}
