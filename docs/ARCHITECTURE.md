# Architecture

EventSphere is a single Next.js 16 (App Router) application deployed on Vercel.
There is no separate backend server: **Server Components** read data and
**Server Actions** perform writes, both running on Vercel's Node.js functions.
All data lives in **Supabase PostgreSQL**, protected by **Row Level Security**.
Critical operations (seat holds, payment confirmation, check-in, cancellation,
approvals) are **PostgreSQL functions** that lock rows, so they are atomic.

## Architecture diagram

```mermaid
flowchart LR
  subgraph Browser
    UI["React UI<br/>(Server + Client Components)"]
  end

  subgraph Vercel["Vercel — Next.js 16 App Router"]
    Proxy["proxy.ts<br/>session refresh + route guard"]
    RSC["Server Components<br/>(pages, data reads)"]
    SA["Server Actions<br/>auth · bookings · organizer · admin<br/>(Zod validation + role checks)"]
    DAL["lib/auth/dal.ts<br/>getCurrentUser / requireRole"]
  end

  subgraph Supabase
    Auth["Supabase Auth<br/>(email + password, JWT cookies)"]
    DB[("PostgreSQL<br/>tables + RLS policies")]
    Fn["SECURITY DEFINER functions<br/>create_booking_hold · confirm_booking_payment<br/>check_in_ticket · cancel_booking · cancel_event<br/>review_event · admin_*"]
    Storage["Storage bucket<br/>event-banners"]
  end

  SMTP["Custom SMTP (Resend)<br/>verification + reset emails"]

  UI -->|HTTPS| Proxy --> RSC
  UI -->|form posts| SA
  RSC --> DAL
  SA --> DAL
  DAL -->|getClaims| Auth
  RSC -->|"supabase-js (user JWT)"| DB
  SA -->|"rpc() / insert / update"| Fn
  Fn --> DB
  SA -->|banner upload| Storage
  Auth --> SMTP
```

### Key decisions

| Decision | Why |
| --- | --- |
| Next.js Server Actions instead of a separate REST API | One deployment, typed end to end, forms work without client-side fetch code. |
| Supabase Auth with HTTP-only cookies (`@supabase/ssr`) | Passwords are hashed by Supabase (bcrypt); no tokens in `localStorage`. |
| RLS on every table + column-level grants | Users can only read their own bookings/tickets even if they call the API directly. |
| Inventory changes only inside database functions | `UPDATE … WHERE sold + held + qty <= quantity` is atomic, so no overselling; `SELECT … FOR UPDATE` prevents double confirmation / double check-in. |
| QR codes contain only a random ticket UUID | No personal data in the QR; check-in still requires a signed-in organizer of that event. |
| Mock payment inputs have no `name` attribute | Card/UPI fields are never submitted to the server, so nothing is stored. |

## ER diagram

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "has"
  PROFILES ||--o{ ORGANIZER_REQUESTS : "submits"
  PROFILES ||--o{ EVENTS : "organizes"
  EVENTS ||--o{ TICKET_TYPES : "offers"
  PROFILES ||--o{ BOOKINGS : "makes"
  EVENTS ||--o{ BOOKINGS : "for"
  TICKET_TYPES ||--o{ BOOKINGS : "of"
  BOOKINGS ||--o{ TICKETS : "issues"
  PROFILES ||--o{ TICKETS : "holds"
  PROFILES ||--o{ NOTIFICATIONS : "receives"

  PROFILES {
    uuid id PK "= auth.users.id"
    text full_name
    app_role role "attendee | organizer | admin"
    timestamptz created_at
  }
  ORGANIZER_REQUESTS {
    uuid id PK
    uuid user_id FK
    text organization_name
    text reason
    text status "pending | approved | rejected"
    text admin_note
    uuid reviewed_by FK
  }
  EVENTS {
    uuid id PK
    uuid organizer_id FK
    text title
    text description
    text category
    text venue
    text city
    bool is_online
    text online_url
    text banner_url
    timestamptz starts_at
    timestamptz ends_at
    int capacity
    numeric price_from
    event_status status "draft | published | cancelled"
    text review_status "not_submitted | pending | approved | rejected"
    text review_note
    text cancel_reason
  }
  TICKET_TYPES {
    uuid id PK
    uuid event_id FK
    text name
    numeric price
    int quantity
    int sold
    int held "sold + held <= quantity"
    timestamptz sale_starts_at
    timestamptz sale_ends_at
  }
  BOOKINGS {
    uuid id PK
    uuid user_id FK
    uuid event_id FK
    uuid ticket_type_id FK
    int quantity
    numeric unit_price
    numeric total_amount
    text status "held | confirmed | cancelled | expired"
    timestamptz hold_expires_at "now() + 10 min"
    text payment_method "card | upi (mock)"
    text payment_reference "MOCK-xxxx"
  }
  TICKETS {
    uuid id PK "value encoded in the QR"
    uuid booking_id FK
    uuid event_id FK
    uuid ticket_type_id FK
    uuid user_id FK
    text status "valid | cancelled"
    timestamptz checked_in_at
    uuid checked_in_by FK
  }
  NOTIFICATIONS {
    uuid id PK
    uuid user_id FK
    text title
    text body
    text link
    timestamptz read_at
  }
```

## Folder structure

```text
app/
  (auth)/            login, signup, forgot-password, reset-password
  (app)/             events, checkout, bookings, tickets, notifications, organizer/*
  admin/             admin overview, event approvals, organizer requests, users
  auth/confirm/      email-link handler (verify email, password recovery)
  dashboard/         role-based dashboard + profile actions
components/          UI grouped by feature (auth, bookings, events, organizer, admin, tickets, ui)
lib/
  auth/              Data Access Layer, auth Server Actions, Zod schemas
  bookings/          booking + payment Server Actions
  organizer/         event management + check-in Server Actions
  admin/             admin Server Actions
  supabase/          browser, server and proxy clients
supabase/
  migrations/        versioned SQL (schema, RLS, functions)
  seed.sql           demo events and ticket types
types/               TypeScript types for the database
```
