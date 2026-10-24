# Workflow diagrams

All seven flows required by the brief. Each box names the real page, Server
Action or database function in this repository.

## 1. Sign up and login

```mermaid
sequenceDiagram
  actor U as User
  participant P as /signup or /login
  participant SA as signUpAction / signInAction
  participant A as Supabase Auth
  participant DB as PostgreSQL
  participant M as Email (SMTP)

  U->>P: Fill form
  P->>SA: Submit (Server Action)
  SA->>SA: Zod validation
  alt Sign up
    SA->>A: auth.signUp(email, password, full_name)
    A->>DB: insert auth.users
    DB->>DB: trigger handle_new_user → profiles (role = attendee)
    A->>M: Confirmation email (token_hash link)
    U->>P: Click link → /auth/confirm
    P->>A: verifyOtp(token_hash) → session cookie
    P-->>U: Redirect /dashboard
  else Log in
    SA->>A: signInWithPassword
    A-->>SA: Session (HTTP-only cookies)
    SA-->>U: Redirect to ?next or /dashboard
  end
```

## 2. Forgot / reset password

```mermaid
sequenceDiagram
  actor U as User
  participant F as /forgot-password
  participant A as Supabase Auth
  participant C as /auth/confirm
  participant R as /reset-password

  U->>F: Enter email
  F->>A: resetPasswordForEmail (same reply whether or not the account exists)
  A-->>U: Email with recovery link (type=recovery)
  U->>C: Open link
  C->>A: verifyOtp → temporary session
  C-->>R: Redirect
  U->>R: New password (Zod: 8+ chars, letter + number)
  R->>A: getClaims (session must exist) → updateUser(password)
  R-->>U: "Your password has been updated"
```

## 3. Organizer approval

```mermaid
sequenceDiagram
  actor At as Attendee
  actor Ad as Admin
  participant D as /dashboard
  participant Q as /admin/organizer-requests
  participant DB as PostgreSQL

  At->>D: "Become an organizer" form
  D->>DB: insert organizer_requests (RLS: own row, role must be attendee)
  Ad->>Q: Review pending requests
  Q->>DB: rpc review_organizer_request(approve)
  DB->>DB: is_admin()? → status approved, profiles.role = organizer
  At->>D: Dashboard now shows organizer tools
```

## 4. Event creation and publishing

```mermaid
stateDiagram-v2
  [*] --> Draft: Organizer creates event (/organizer/events/new)
  Draft --> Draft: Edit details, upload banner, add ticket types
  Draft --> Pending: submit_event_for_review() — needs ≥1 ticket type, future date
  Pending --> Published: Admin review_event(approve) — not own event
  Pending --> Rejected: Admin review_event(reject, note)
  Rejected --> Pending: Organizer edits and resubmits
  Published --> Cancelled: cancel_event() — bookings cancelled, attendees notified
  Draft --> Cancelled: cancel_event()
  Published --> [*]
```

## 5. Ticket booking (select → hold → mock payment → confirm → ticket)

```mermaid
sequenceDiagram
  actor U as Attendee
  participant E as /events/[id]
  participant C as /checkout/[bookingId]
  participant DB as PostgreSQL functions

  U->>E: Choose ticket type + quantity (summary shown)
  E->>DB: create_booking_hold(type, qty)
  Note over DB: release_expired_holds()<br/>UPDATE ticket_types SET held = held + qty<br/>WHERE sold + held + qty <= quantity (atomic)
  DB-->>C: booking (status held, expires in 10 min)
  C-->>U: Countdown + mock card / UPI form (fields never submitted)
  alt Pay now (simulated, 1.5 s loading)
    U->>C: Pay
    C->>DB: confirm_booking_payment(booking, method)
    Note over DB: SELECT … FOR UPDATE<br/>already confirmed → no new tickets<br/>expired → release seats
    DB->>DB: held → sold, insert 1 ticket per seat, notification
    C-->>U: /checkout/[id]/success → My tickets (QR codes)
  else Simulate failed payment
    U->>C: Fail
    C->>DB: cancel_booking_hold → seats released
  else Hold expires
    DB->>DB: release_expired_holds() on next booking/checkout read
  end
```

## 6. Booking cancellation

```mermaid
sequenceDiagram
  actor U as Attendee
  participant B as /bookings/[id]
  participant DB as cancel_booking()

  U->>B: Cancel booking (confirm dialog)
  B->>DB: rpc cancel_booking(id)
  DB->>DB: lock booking FOR UPDATE, owner only
  alt already cancelled
    DB-->>B: "already_cancelled" (no double release)
  else event started or a ticket checked in
    DB-->>B: error message
  else
    DB->>DB: booking + tickets → cancelled, sold -= qty, notification
    DB-->>B: "Booking cancelled" (mock payment: no refund involved)
  end
```

Event cancellation (`cancel_event`) cancels every booking and ticket for the
event, releases all inventory and sends each attendee an in-app notification.

## 7. QR check-in

```mermaid
sequenceDiagram
  actor O as Organizer
  participant S as /organizer/check-in
  participant DB as check_in_ticket()

  O->>S: Scan QR (camera, BarcodeDetector) or type ticket ID
  S->>S: requireRole(organizer/admin), extract UUID
  S->>DB: rpc check_in_ticket(ticket_id)
  DB->>DB: lock ticket FOR UPDATE
  alt not found
    DB-->>S: invalid
  else not this organizer's event
    DB-->>S: not_authorized
  else ticket/event cancelled or event ended
    DB-->>S: ticket_cancelled / event_cancelled / event_ended
  else already checked in
    DB-->>S: already_checked_in (time shown)
  else
    DB->>DB: checked_in_at = now(), checked_in_by = organizer
    DB-->>S: checked_in (holder name, ticket type)
  end
```
