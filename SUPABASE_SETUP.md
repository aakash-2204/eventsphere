# Supabase setup guide (Phase 2)

Follow these steps once to connect EventSphere to your own Supabase project.
Until you do, the landing page works, but login and sign-up show a
"Supabase is not connected yet" notice.

---

## 1. Create a Supabase project

1. Go to <https://supabase.com/dashboard> and sign in.
2. Click **New project**, choose a name (e.g. `eventsphere`), set a strong
   database password (save it somewhere safe), pick a region close to you
   (e.g. Mumbai), and click **Create new project**.
3. Wait a minute or two for it to finish setting up.

## 2. Add your keys to `.env.local`

1. In the project, open **Project Settings → API Keys**.
   - Copy the **publishable key** (starts with `sb_publishable_`). Older
     projects show an **anon public** key instead. Either one works.
   - **Do not** copy the `service_role` / secret key. This app does not need it.
2. Open **Project Settings → Data API** (or the **Connect** button) and copy the
   **Project URL** (looks like `https://abcdefgh.supabase.co`).
3. In the project folder, copy the example file:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell: `Copy-Item .env.example .env.local`

4. Open `.env.local` and replace the placeholders:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

`.env.local` is in `.gitignore`, so it will never be committed.

## 3. Create the database tables

1. In Supabase, open **SQL Editor → New query**.
2. Open `supabase/migrations/20261023120000_initial_schema.sql` from this
   project, copy **all** of it, paste it into the editor, and click **Run**.
3. You should see "Success. No rows returned". Under **Table Editor** you will
   now see `profiles`, `organizer_requests` and `events`, each marked with
   RLS enabled.

> Run the migration only once. Running it again fails with "type already
> exists". That's harmless, but means it was already applied.

## 4. Configure authentication URLs

Open **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000`
  (change this to your Vercel URL when you deploy, see step 8)
- **Redirect URLs**: click **Add URL** and add:
  - `http://localhost:3000/**`
  - later, your Vercel URL: `https://your-app.vercel.app/**`

## 5. Update two email templates (recommended)

The default emails only work if the link is opened in the **same browser**
that signed up. These templates work from any device.

Open **Authentication → Emails → Templates**.

**Confirm signup**: replace the link in the message body with:

```html
<h2>Confirm your EventSphere account</h2>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard">Verify my email</a></p>
```

**Reset password**: replace the link with:

```html
<h2>Reset your EventSphere password</h2>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a></p>
```

Click **Save** after each one.

> **Email limits:** Supabase's built-in email service is for testing only. It
> sends just a few emails per hour, and may only deliver to email addresses of
> your Supabase organization's members. For a demo with other people, set up
> custom SMTP (e.g. Resend) under **Authentication → Emails → SMTP Settings**.

## 6. Start the app

```bash
npm run dev
```

Restart it if it was already running, because `.env.local` is only read at
startup. Open <http://localhost:3000> and click **Sign Up**.

## 7. Make yourself an admin

Nobody can make themselves an admin from the app, by design. Do it once from
the SQL Editor (which runs with full database rights):

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Replace the email with the one you signed up with, then refresh `/dashboard`.
You'll see a **Review organizer requests** button.

## 8. Deploying to Vercel (when you're ready)

1. In Vercel, open your project → **Settings → Environment Variables** and add
   the same three variables. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL.
2. In Supabase, set **Site URL** to the Vercel URL and add
   `https://your-app.vercel.app/**` to **Redirect URLs**.
3. **Redeploy.** `NEXT_PUBLIC_` values are built into the app, so a new
   deployment is needed after changing them.

---

## How to test it

| Test | What to do | Expected result |
| --- | --- | --- |
| Sign up | `/signup` with your email | "Verify your email" message, and an email arrives |
| Validation | Submit sign-up with a short password | Red error under the field, no account created |
| Verify email | Click the link in the email | You land on `/dashboard`, signed in |
| Bad link | Click the same link again | "This link didn't work" page |
| Log out | Click **Log out** | Back on the home page; header shows Log In / Sign Up |
| Protected page | Visit `/dashboard` while logged out | Redirected to `/login?next=/dashboard` |
| Log in | Log in with correct details | Redirected to `/dashboard` |
| Wrong password | Log in with a wrong password | "Incorrect email or password." |
| Forgot password | `/forgot-password`, then use the email link | `/reset-password` form, then "Your password has been updated." |
| Organizer request | As an attendee, submit the "Become an organizer" form | "Request sent" message, then a "waiting for review" notice |
| Admin review | As admin, open `/admin/organizer-requests` and approve | That user's dashboard now shows the **organizer** badge |
| Non-admin | As an attendee, visit `/admin/organizer-requests` | Redirected to `/dashboard` |

### Proving users can't promote themselves (optional)

Run this in the SQL Editor. It pretends to be a normal signed-in user and tries
to become an admin. Replace `USER-ID` with an id from **Authentication → Users**.

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"USER-ID","role":"authenticated"}', true);

update public.profiles set role = 'admin' where id = 'USER-ID';
-- Expected: ERROR: permission denied for table profiles

rollback;
```

---

## Troubleshooting

- **"Supabase is not connected yet"**: `.env.local` is missing or has a typo,
  or you didn't restart `npm run dev`.
- **Email link goes to `/auth/error`**: the link expired, was already used,
  or your Redirect URLs (step 4) don't include `http://localhost:3000/**`.
- **"Email not confirmed"**: click the link in your verification email
  first. Check your spam folder.
- **Dashboard says "no profile was found"**: the account was created before
  you ran the migration. Delete the user under **Authentication → Users** and
  sign up again.
- **No email arrives**: you may have hit the built-in email limit (see step 5).
  Wait an hour or configure custom SMTP.
