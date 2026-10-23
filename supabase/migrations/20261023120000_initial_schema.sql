-- =============================================================================
-- EventSphere — Phase 2 initial schema
--
-- Creates: roles, user profiles, organizer access requests and events.
-- Security model:
--   * Every table has Row Level Security (RLS) turned on.
--   * Table privileges are granted explicitly, column by column where it
--     matters, so users can only ever change the columns we allow.
--   * A user's role can only change through review_organizer_request(),
--     which checks that the caller is an admin.
-- Run this once in the Supabase SQL Editor (see SUPABASE_SETUP.md).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Enum types
-- -----------------------------------------------------------------------------

create type public.app_role as enum ('attendee', 'organizer', 'admin');

create type public.organizer_request_status as enum ('pending', 'approved', 'rejected');

create type public.event_status as enum ('draft', 'published', 'cancelled');


-- -----------------------------------------------------------------------------
-- 2. Helper: keep updated_at current
-- -----------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- 3. Profiles — one row per Supabase Auth user
-- -----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 100),
  role public.app_role not null default 'attendee',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile and role for each auth user.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically when someone signs up.
-- The role is ALWAYS 'attendee' here. We never read the role from the signup
-- metadata, because the browser controls that metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 4. Role helpers used inside RLS policies
--
-- These are SECURITY DEFINER so they can read profiles without triggering the
-- profiles RLS policies again (which would cause infinite recursion).
-- -----------------------------------------------------------------------------

create function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;


-- -----------------------------------------------------------------------------
-- 5. Organizer access requests
-- -----------------------------------------------------------------------------

create table public.organizer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  organization_name text not null check (char_length(organization_name) between 2 and 120),
  reason text not null check (char_length(reason) between 20 and 1000),
  status public.organizer_request_status not null default 'pending',
  admin_note text check (char_length(admin_note) <= 500),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.organizer_requests is 'Attendees asking to become organizers. Reviewed by admins.';

-- A user can have at most one pending request at a time.
create unique index organizer_requests_one_pending_per_user
  on public.organizer_requests (user_id)
  where status = 'pending';

create index organizer_requests_status_idx on public.organizer_requests (status, created_at);


-- -----------------------------------------------------------------------------
-- 6. Events (schema only in Phase 2 — no event UI yet)
-- -----------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  title text not null check (char_length(title) between 3 and 150),
  description text not null default '' check (char_length(description) <= 5000),
  category text not null check (category in ('music', 'tech', 'sports', 'arts', 'food', 'business')),
  venue text not null check (char_length(venue) between 2 and 150),
  city text not null check (char_length(city) between 2 and 80),
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer not null check (capacity > 0),
  price_from numeric(10, 2) not null default 0 check (price_from >= 0),
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (ends_at is null or ends_at > starts_at)
);

comment on table public.events is 'Events created by organizers. Only published events are public.';

create index events_published_starts_at_idx on public.events (starts_at) where status = 'published';
create index events_organizer_idx on public.events (organizer_id);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 7. Admin-only function to approve or reject an organizer request
--
-- This is the ONLY way a role can change. It checks is_admin() itself, so a
-- normal user calling it gets an error.
-- -----------------------------------------------------------------------------

create function public.review_organizer_request(
  request_id uuid,
  approve boolean,
  note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review organizer requests'
      using errcode = '42501'; -- insufficient_privilege
  end if;

  update public.organizer_requests
     set status = case when approve then 'approved' else 'rejected' end::public.organizer_request_status,
         admin_note = left(note, 500),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where id = request_id
     and status = 'pending'
  returning user_id into target_user;

  if target_user is null then
    raise exception 'Request not found or already reviewed';
  end if;

  -- Only promote attendees. Never downgrade an existing admin by accident.
  if approve then
    update public.profiles
       set role = 'organizer'
     where id = target_user
       and role = 'attendee';
  end if;
end;
$$;


-- -----------------------------------------------------------------------------
-- 8. Privileges
--
-- Start from nothing, then grant only what the app needs. RLS (below) then
-- limits WHICH ROWS each user can touch.
-- -----------------------------------------------------------------------------

revoke all on public.profiles, public.organizer_requests, public.events from anon, authenticated;

-- profiles: signed-in users can read, and can change ONLY their name.
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

-- organizer_requests: users can create a request with these columns only;
-- status, reviewer and notes can never be set directly.
grant select on public.organizer_requests to authenticated;
grant insert (organization_name, reason) on public.organizer_requests to authenticated;

-- events: anyone can read (RLS limits this to published events);
-- organizers manage their own events.
grant select on public.events to anon, authenticated;
grant insert (title, description, category, venue, city, starts_at, ends_at, capacity, price_from, status)
  on public.events to authenticated;
grant update (title, description, category, venue, city, starts_at, ends_at, capacity, price_from, status)
  on public.events to authenticated;
grant delete on public.events to authenticated;

-- Functions: only signed-in users may call these. Trigger functions are not
-- meant to be called directly at all.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.current_user_role() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.review_organizer_request(uuid, boolean, text) from public, anon;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.review_organizer_request(uuid, boolean, text) to authenticated;


-- -----------------------------------------------------------------------------
-- 9. Row Level Security policies
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.organizer_requests enable row level security;
alter table public.events enable row level security;

-- profiles ---------------------------------------------------------------

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using ((select public.is_admin()));

-- Column grants above already limit updates to full_name.
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- organizer_requests -----------------------------------------------------

create policy "Users can view their own organizer requests"
  on public.organizer_requests for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Admins can view all organizer requests"
  on public.organizer_requests for select
  to authenticated
  using ((select public.is_admin()));

create policy "Attendees can request organizer access"
  on public.organizer_requests for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.current_user_role()) = 'attendee'
  );

-- No update/delete policies: requests change only through
-- review_organizer_request().

-- events -----------------------------------------------------------------

create policy "Anyone can view published events"
  on public.events for select
  to anon, authenticated
  using (status = 'published');

create policy "Organizers can view their own events"
  on public.events for select
  to authenticated
  using (organizer_id = (select auth.uid()));

create policy "Admins can view all events"
  on public.events for select
  to authenticated
  using ((select public.is_admin()));

create policy "Organizers can create their own events"
  on public.events for insert
  to authenticated
  with check (
    organizer_id = (select auth.uid())
    and (select public.current_user_role()) = 'organizer'
  );

create policy "Organizers can update their own events"
  on public.events for update
  to authenticated
  using (
    organizer_id = (select auth.uid())
    and (select public.current_user_role()) = 'organizer'
  )
  with check (organizer_id = (select auth.uid()));

create policy "Admins can update any event"
  on public.events for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Organizers can delete their own draft events"
  on public.events for delete
  to authenticated
  using (
    organizer_id = (select auth.uid())
    and status = 'draft'
  );

create policy "Admins can delete any event"
  on public.events for delete
  to authenticated
  using ((select public.is_admin()));
