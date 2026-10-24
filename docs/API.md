# API reference

EventSphere has no public REST API of its own. The browser talks to Next.js
**Server Actions** (form posts) and **pages** (server-rendered reads). Server
Actions validate input with Zod, check the user's role on the server
(`lib/auth/dal.ts`), and then call Supabase. Every database function re-checks
permissions itself.

All Server Actions return the same shape (`lib/forms.ts`):

```ts
type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>; // per-field validation errors
  values?: Record<string, string>;        // re-filled form values (never passwords)
};
```

## Route handler

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/auth/confirm?token_hash&type[&next]` or `?code` | Verifies email-confirmation and password-recovery links, sets the session cookie, redirects (`/dashboard` or `/reset-password`), else `/auth/error`. |

## Server Actions

| Action | File | Who | What it does |
| --- | --- | --- | --- |
| `signUpAction` | `lib/auth/actions.ts` | Guest | Validates name/email/password, `auth.signUp`, sends verification email. |
| `signInAction` | `lib/auth/actions.ts` | Guest | `signInWithPassword`, redirects to a safe `next` path. |
| `signOutAction` | `lib/auth/actions.ts` | User | Ends the session. |
| `forgotPasswordAction` | `lib/auth/actions.ts` | Guest | Sends a recovery email (same reply for unknown emails). |
| `resetPasswordAction` | `lib/auth/actions.ts` | Recovery session | Sets a new password. |
| `updateProfileAction` | `app/dashboard/actions.ts` | User | Updates `full_name` only. |
| `changePasswordAction` | `app/dashboard/actions.ts` | User | Verifies the current password, then updates it. |
| `requestOrganizerAccessAction` | `app/dashboard/actions.ts` | Attendee | Inserts an organizer request. |
| `reviewOrganizerRequestAction` | `app/dashboard/actions.ts` | Admin | `review_organizer_request` RPC. |
| `createHoldAction` | `lib/bookings/actions.ts` | User | `create_booking_hold` RPC → redirect to checkout. |
| `confirmPaymentAction` | `lib/bookings/actions.ts` | Booking owner | Simulated 1.5 s processing, `confirm_booking_payment` RPC. |
| `failPaymentAction` | `lib/bookings/actions.ts` | Booking owner | `cancel_booking_hold` RPC (simulated failure). |
| `cancelBookingAction` | `lib/bookings/actions.ts` | Booking owner | `cancel_booking` RPC. |
| `markNotificationsReadAction` | `lib/bookings/actions.ts` | User | Marks own notifications read. |
| `saveEventAction` | `lib/organizer/actions.ts` | Organizer | Creates/edits a draft event, optional banner upload to Storage. |
| `addTicketTypeAction` / `deleteTicketTypeAction` | `lib/organizer/actions.ts` | Organizer | Manage ticket types on own drafts (RLS). |
| `submitEventAction` | `lib/organizer/actions.ts` | Organizer | `submit_event_for_review` RPC. |
| `cancelEventAction` | `lib/organizer/actions.ts` | Organizer / admin | `cancel_event` RPC. |
| `checkInAction` | `lib/organizer/actions.ts` | Organizer / admin | `check_in_ticket` RPC. |
| `reviewEventAction` | `lib/admin/actions.ts` | Admin | `review_event` RPC (approve publishes). |
| `setUserRoleAction` | `lib/admin/actions.ts` | Admin | `admin_set_user_role` RPC (attendee ↔ organizer only). |

## Database functions (Supabase RPC)

Defined in `supabase/migrations/`. All are `SECURITY DEFINER` with
`search_path = ''`, callable only by signed-in users, and check permissions
internally.

| Function | Rules enforced |
| --- | --- |
| `create_booking_hold(p_ticket_type_id, p_quantity)` | Event published and in the future, sale window open, 1–10 seats, atomic inventory check, 10-minute hold. |
| `confirm_booking_payment(p_booking_id, p_method)` | Owner only, row locked, idempotent (`already_confirmed`), expired holds released, issues one ticket per seat. |
| `cancel_booking_hold(p_booking_id)` | Owner only; releases held seats once. |
| `cancel_booking(p_booking_id)` | Owner only, before event start, no checked-in tickets; releases seats once. |
| `release_expired_holds()` | Marks overdue holds `expired` and returns their seats. |
| `check_in_ticket(p_ticket_id)` | Organizer of the event or admin; one-time; reports invalid / cancelled / already used / ended. |
| `submit_event_for_review(p_event_id)` | Owner organizer, draft, future date, ≥1 ticket type. |
| `review_event(p_event_id, p_approve, p_note)` | Admin only, not own event, pending only; approve = publish. |
| `cancel_event(p_event_id, p_reason)` | Owner or admin; cancels bookings/tickets, notifies attendees; idempotent. |
| `review_organizer_request(request_id, approve, note)` | Admin only; promotes attendee → organizer. |
| `admin_set_user_role(p_user_id, p_role)` | Admin only; never grants admin; cannot change own or another admin's role. |
| `admin_platform_stats()` / `admin_list_users()` | Admin only. |

## Pages (reads)

| Path | Access |
| --- | --- |
| `/`, `/events`, `/events/[id]` | Public (published events only via RLS) |
| `/dashboard`, `/bookings`, `/bookings/[id]`, `/tickets`, `/tickets/[id]`, `/notifications`, `/checkout/[id]` | Signed-in; own records only |
| `/organizer/events`, `/organizer/events/new`, `/organizer/events/[id]`, `/organizer/check-in` | Organizer (admin may view/cancel/check in) |
| `/admin`, `/admin/events`, `/admin/organizer-requests`, `/admin/users` | Admin |
