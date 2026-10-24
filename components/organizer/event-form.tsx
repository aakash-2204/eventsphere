"use client";

import { useActionState, useState } from "react";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { categories } from "@/lib/events/constants";
import { initialFormState } from "@/lib/forms";
import { saveEventAction } from "@/lib/organizer/actions";

export type EventFormDefaults = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  isOnline?: boolean;
  venue?: string;
  city?: string;
  onlineUrl?: string;
  startsAt?: string;
  endsAt?: string;
  capacity?: string;
};

/** Create / edit form for an event draft, including the banner upload. */
export function EventForm({ defaults = {} }: { defaults?: EventFormDefaults }) {
  const [state, formAction] = useActionState(saveEventAction, initialFormState);
  const v = { ...defaults, ...state.values } as Record<string, string | boolean | undefined>;
  const [isOnline, setIsOnline] = useState(Boolean(defaults.isOnline));
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage state={state} />
      {defaults.id ? <input type="hidden" name="eventId" value={defaults.id} /> : null}

      <FormField label="Title" name="title" required defaultValue={v.title as string} errors={errors.title} />
      <FormField label="Description" name="description" multiline defaultValue={v.description as string} errors={errors.description} />

      <label className="block text-sm font-medium text-slate-200">
        Category
        <select
          name="category"
          defaultValue={(v.category as string) ?? ""}
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-navy-950/80 px-4 py-3 text-sm text-white"
        >
          <option value="" disabled>Choose…</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        {errors.category ? <span className="mt-1 block text-xs text-rose-300">{errors.category[0]}</span> : null}
      </label>

      <label className="flex items-center gap-3 text-sm text-slate-200">
        <input type="checkbox" name="isOnline" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} className="size-4 accent-violet-500" />
        This is an online event
      </label>

      {isOnline ? (
        <FormField label="Online event link (https://)" name="onlineUrl" type="url" defaultValue={v.onlineUrl as string} errors={errors.onlineUrl} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Venue" name="venue" defaultValue={v.venue as string} errors={errors.venue} />
          <FormField label="City" name="city" defaultValue={v.city as string} errors={errors.city} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Starts (IST)" name="startsAt" type="datetime-local" defaultValue={v.startsAt as string} errors={errors.startsAt} />
        <FormField label="Ends (IST, optional)" name="endsAt" type="datetime-local" defaultValue={v.endsAt as string} errors={errors.endsAt} />
      </div>
      <FormField label="Capacity" name="capacity" type="number" min={1} defaultValue={(v.capacity as string) ?? "100"} errors={errors.capacity} />

      <label className="block text-sm font-medium text-slate-200">
        Banner image (JPG, PNG or WebP, max 4 MB)
        <input type="file" name="banner" accept="image/jpeg,image/png,image/webp" className="mt-1.5 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:text-white" />
      </label>

      <SubmitButton pendingLabel="Saving…">{defaults.id ? "Save changes" : "Create draft"}</SubmitButton>
    </form>
  );
}
