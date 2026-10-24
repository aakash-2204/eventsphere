# Setup, database, seed data and deployment

See also [`SUPABASE_SETUP.md`](../SUPABASE_SETUP.md) for the step-by-step
Supabase dashboard screens (auth URLs, email templates, SMTP).

## 1. Local installation

```bash
git clone https://github.com/aakash-2204/eventsphere.git
cd eventsphere
npm install
cp .env.example .env.local   # then fill in your own values
npm run dev                  # http://localhost:3000
```

On Windows machines where antivirus software (e.g. Avast) intercepts HTTPS,
Node.js may fail with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Either add an
exception for `*.supabase.co` in the antivirus, or start the dev server with
`$env:NODE_OPTIONS = '--use-system-ca'` in that PowerShell window. Never
disable certificate checks.

## 2. Environment variables

| Name | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-ref.supabase.co` | Project URL (no `/rest/v1`). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | Publishable/anon key. Safe in the browser because of RLS. |
| `NEXT_PUBLIC_SITE_URL` | `https://eventsphere-lac.vercel.app` | Used to build links in emails. `http://localhost:3000` locally. |

No service-role / secret key is used anywhere in this project. Only
`.env.example` (placeholders) is committed; `.env.local` is git-ignored.

## 3. Database migrations

Run each file **once, in order**, in Supabase → **SQL Editor → New query → Run**:

1. `supabase/migrations/20261023120000_initial_schema.sql` — roles, profiles,
   organizer requests, events, RLS.
2. `supabase/migrations/20261024080000_booking_ticketing.sql` — event approval,
   ticket types, bookings, tickets, notifications, booking/check-in/cancel
   functions, banner storage bucket.

Both are additive and do not delete data.

## 4. Test accounts (one per role)

Accounts are created through the real sign-up flow — nothing is hard-coded.

1. **Attendee:** sign up at `/signup`, confirm the email.
2. **Organizer:** sign up a second account, then from its dashboard submit
   "Become an organizer". Approve it as admin at `/admin/organizer-requests`.
3. **Admin:** sign up a third account, then in the SQL Editor run (replace the
   email):

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'admin@your-domain.example');
   ```

   The app itself never lets anyone grant the admin role.

## 5. Seed demo data

`supabase/seed.sql` creates 12 fictional events in 6 categories (9 published,
2 pending approval, 1 draft) with 18 ticket types. It attaches them to an
existing **organizer** account:

1. Open `supabase/seed.sql`, replace `ORGANIZER_EMAIL_HERE` with your
   organizer test account's email.
2. Run it in the SQL Editor. It is safe to run again (fixed ids,
   `on conflict do nothing`), never changes roles and never touches other users.

## 6. Deployment (Vercel)

1. Import the GitHub repository into Vercel (framework: Next.js).
2. Add the three environment variables above (Production + Preview).
3. Production branch: `master`. Every push to `master` redeploys.
4. Supabase → Authentication → URL Configuration:
   - Site URL: `https://eventsphere-lac.vercel.app`
   - Redirect URLs: `https://eventsphere-lac.vercel.app/**` and `http://localhost:3000/**`
5. `NEXT_PUBLIC_*` values are built into the app: redeploy after changing them.
