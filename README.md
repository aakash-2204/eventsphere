# EventSphere — Event Booking & Ticketing Platform

A full-stack web app where **organizers** create events and sell tickets,
**attendees** discover events, book with a **mock payment** flow and receive
**QR-coded tickets**, and **admins** approve events and manage users.

- **Live site:** https://eventsphere-lac.vercel.app
- **Repository:** https://github.com/aakash-2204/eventsphere
- Built for the *Intern Project – Event Booking & Ticketing Platform* brief.

## Features

**Attendee**
- Sign up with email verification, log in, forgot/reset password, change password.
- Explore events: search by name, filter by category, city, date and price, sort by date or price (filters live in the URL).
- Event detail page, choose ticket type and quantity, checkout summary.
- Seats held for **10 minutes** during checkout (enforced in the database).
- **Mock payment** screen (card or UPI, clearly labelled, nothing stored) with loading state, success or simulated failure.
- My bookings (status, detail, cancel with confirmation), My tickets (upcoming / past, one QR per seat), in-app notifications.

**Organizer**
- Request organizer access from the dashboard.
- Create and edit draft events: details, banner upload, date/time, venue **or** online link, multiple ticket types (price, quantity, sale window).
- Submit for admin approval; see draft / pending / rejected / published / cancelled states.
- Sales summary with a sold-vs-capacity chart, attendee list, cancel event (attendees notified).
- QR check-in (camera scan where supported, or type the ticket ID); each ticket checks in only once.

**Admin**
- Platform overview stats from live data.
- Event approval queue (approve & publish / reject with note; cannot approve own event).
- Organizer request review and user role management (admin role can only be granted in the database).

## Tech stack and why

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS 4, Lucide icons | Server Components + Server Actions keep data access on the server. |
| Backend | Next.js Server Actions + PostgreSQL functions | One deployment; critical logic is atomic inside the database. |
| Database | Supabase PostgreSQL with Row Level Security | Users can only access their own records, even via the API. |
| Auth | Supabase Auth via `@supabase/ssr` (HTTP-only cookies) | Hashed passwords, email verification, no tokens in `localStorage`. |
| Validation | Zod on every Server Action | Server-side validation for all input. |
| QR codes | `qrcode` | Server-generated QR images containing only an opaque ticket id. |
| Storage | Supabase Storage (`event-banners`) | Event banner uploads. |
| Hosting | Vercel (app) + Supabase (database, auth, storage) | Free tiers. |

## Documentation

- [Architecture diagram, ER diagram, folder structure](docs/ARCHITECTURE.md)
- [Seven workflow diagrams](docs/FLOWS.md)
- [API / Server Action / database function reference](docs/API.md)
- [Setup, migrations, seed data, test accounts, deployment](docs/SETUP.md)
- [Test plan and results](docs/TESTING.md)
- [Supabase dashboard configuration](SUPABASE_SETUP.md)

## Quick start

```bash
npm install
cp .env.example .env.local      # fill in your Supabase URL and publishable key
npm run dev                     # http://localhost:3000
```

Then run the two SQL migrations and (optionally) `supabase/seed.sql` as described in [docs/SETUP.md](docs/SETUP.md).

## Environment variables

| Name | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `NEXT_PUBLIC_SITE_URL` | Base URL used in email links |

## Test logins

Test accounts for the three roles are created with the real sign-up flow (see
[docs/SETUP.md §4](docs/SETUP.md#4-test-accounts-one-per-role)). Their
credentials are shared privately with evaluators and are not stored in this
repository.

## Known limitations

- Payment is a simulation by design; no money moves and no refunds are processed.
- Seat holds expire server-side when the next booking or checkout request runs (no background job).
- Camera QR scanning uses the browser's `BarcodeDetector` (Chrome / Android). Other browsers use manual ticket-ID entry.
- Data fetching uses Server Components and Server Actions rather than TanStack Query / React Hook Form; validation is Zod on the server.
- Avatars are not implemented (profile name editing and password change are).
