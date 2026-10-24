-- =============================================================================
-- EventSphere — Phase 3: event approval, ticket types, bookings, mock payment,
-- QR tickets, check-in, cancellation, notifications, banner storage.
--
-- Additive only: no tables are dropped and no existing data is deleted.
-- Every inventory / status change happens inside SECURITY DEFINER functions
-- that lock rows (FOR UPDATE), so seats can never be oversold and repeated
-- clicks cannot confirm, cancel or check in twice.
-- Run once in the Supabase SQL Editor, after 20261023120000_initial_schema.sql.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Events: approval workflow, online events, banner, cancellation
-- -----------------------------------------------------------------------------

alter table public.events
  add column if not exists review_status text not null default 'not_submitted'
    check (review_status in ('not_submitted', 'pending', 'approved', 'rejected')),
  add column if not exists review_note text check (char_length(review_note) <= 500),
  add column if not exists is_online boolean not null default false,
  add column if not exists online_url text check (online_url is null or online_url ~ '^https://'),
  add column if not exists banner_url text check (banner_url is null or banner_url ~ '^https://'),
  add column if not exists cancel_reason text check (char_length(cancel_reason) <= 500);

create index if not exists events_review_status_idx on public.events (review_status);

-- Organizers may no longer set status directly: publishing needs admin
-- approval and cancelling must also cancel bookings, so both go through
-- the functions below.
revoke insert (status) on public.events from authenticated;
revoke update (status) on public.events from authenticated;
grant insert (is_online, online_url, banner_url) on public.events to authenticated;
grant update (is_online, online_url, banner_url) on public.events to authenticated;

-- Organizers edit only drafts that are not waiting for review.
drop policy if exists "Organizers can update their own events" on public.events;
create policy "Organizers can update their own draft events"
  on public.events for update
  to authenticated
  using (
    organizer_id = (select auth.uid())
    and status = 'draft'
    and review_status <> 'pending'
    and (select public.current_user_role()) = 'organizer'
  )
  with check (organizer_id = (select auth.uid()) and status = 'draft');


-- -----------------------------------------------------------------------------
-- 2. Ticket types (inventory lives here: sold + held can never exceed quantity)
-- -----------------------------------------------------------------------------

create table if not exists public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  price numeric(10, 2) not null default 0 check (price >= 0),
  quantity integer not null check (quantity > 0 and quantity <= 100000),
  sold integer not null default 0 check (sold >= 0),
  held integer not null default 0 check (held >= 0),
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ticket_types_no_oversell check (sold + held <= quantity),
  constraint ticket_types_sale_window check (sale_ends_at is null or sale_starts_at is null or sale_ends_at > sale_starts_at)
);

create index if not exists ticket_types_event_idx on public.ticket_types (event_id);


-- -----------------------------------------------------------------------------
-- 3. Bookings (one row per checkout) and tickets (one row per seat)
-- -----------------------------------------------------------------------------

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types (id) on delete cascade,
  quantity integer not null check (quantity between 1 and 10),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  status text not null default 'held' check (status in ('held', 'confirmed', 'cancelled', 'expired')),
  hold_expires_at timestamptz not null,
  -- Mock payment record. Only the method and a fake reference are stored —
  -- never card numbers, CVV or UPI details.
  payment_method text check (payment_method in ('card', 'upi')),
  payment_reference text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists bookings_user_idx on public.bookings (user_id, created_at desc);
create index if not exists bookings_event_idx on public.bookings (event_id);
create index if not exists bookings_held_idx on public.bookings (hold_expires_at) where status = 'held';

create table if not exists public.tickets (
  -- The id is the opaque value encoded in the QR code. It grants nothing on its
  -- own: check-in still requires a signed-in organizer of that event.
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'valid' check (status in ('valid', 'cancelled')),
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists tickets_user_idx on public.tickets (user_id);
create index if not exists tickets_event_idx on public.tickets (event_id);
create index if not exists tickets_booking_idx on public.tickets (booking_id);


-- -----------------------------------------------------------------------------
-- 4. In-app notifications
-- -----------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);


-- -----------------------------------------------------------------------------
-- 5. Privileges and Row Level Security for the new tables
-- -----------------------------------------------------------------------------

revoke all on public.ticket_types, public.bookings, public.tickets, public.notifications from anon, authenticated;

grant select on public.ticket_types to anon, authenticated;
grant insert (event_id, name, price, quantity, sale_starts_at, sale_ends_at) on public.ticket_types to authenticated;
grant update (name, price, quantity, sale_starts_at, sale_ends_at) on public.ticket_types to authenticated;
grant delete on public.ticket_types to authenticated;

grant select on public.bookings to authenticated;          -- writes only via functions
grant select on public.tickets to authenticated;           -- writes only via functions
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

alter table public.ticket_types enable row level security;
alter table public.bookings enable row level security;
alter table public.tickets enable row level security;
alter table public.notifications enable row level security;

-- Helper: is the current user the organizer of this event?
create or replace function public.is_event_organizer(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.events
    where id = p_event_id and organizer_id = auth.uid()
  );
$$;

-- ticket_types
create policy "Anyone can view ticket types of published events"
  on public.ticket_types for select to anon, authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.status = 'published'));

create policy "Organizers and admins can view their ticket types"
  on public.ticket_types for select to authenticated
  using ((select public.is_event_organizer(event_id)) or (select public.is_admin()));

create policy "Organizers manage ticket types of their draft events"
  on public.ticket_types for all to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = event_id and e.organizer_id = (select auth.uid())
      and e.status = 'draft' and e.review_status <> 'pending'
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = event_id and e.organizer_id = (select auth.uid())
      and e.status = 'draft' and e.review_status <> 'pending'
  ));

-- bookings
create policy "Users view their own bookings"
  on public.bookings for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Organizers view bookings for their events"
  on public.bookings for select to authenticated
  using ((select public.is_event_organizer(event_id)));

create policy "Admins view all bookings"
  on public.bookings for select to authenticated
  using ((select public.is_admin()));

-- tickets
create policy "Users view their own tickets"
  on public.tickets for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Organizers view tickets for their events"
  on public.tickets for select to authenticated
  using ((select public.is_event_organizer(event_id)));

create policy "Admins view all tickets"
  on public.tickets for select to authenticated
  using ((select public.is_admin()));

-- notifications
create policy "Users view their own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users mark their own notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Organizers can see attendee names for their events (attendee list).
create policy "Organizers view profiles of their attendees"
  on public.profiles for select to authenticated
  using (exists (
    select 1 from public.bookings b
    join public.events e on e.id = b.event_id
    where b.user_id = profiles.id and e.organizer_id = (select auth.uid())
  ));


-- -----------------------------------------------------------------------------
-- 6. Booking functions: hold -> mock payment -> confirm / fail / expire
-- -----------------------------------------------------------------------------

-- Releases every expired hold. Safe to call any time; each hold is released
-- exactly once because the status changes from 'held' in the same statement.
create or replace function public.release_expired_holds()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  released integer;
begin
  with expired as (
    update public.bookings
       set status = 'expired'
     where status = 'held' and hold_expires_at < now()
    returning ticket_type_id, quantity
  ), totals as (
    select ticket_type_id, sum(quantity)::int as qty from expired group by ticket_type_id
  )
  update public.ticket_types t
     set held = greatest(t.held - totals.qty, 0)
    from totals
   where t.id = totals.ticket_type_id;
  get diagnostics released = row_count;
  return released;
end;
$$;

-- Reserves seats for 10 minutes. The single UPDATE ... WHERE sold + held + qty
-- <= quantity is atomic, so two buyers can never take the last seat twice.
create or replace function public.create_booking_hold(p_ticket_type_id uuid, p_quantity integer)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_type public.ticket_types;
  v_event public.events;
  v_booking uuid;
begin
  if v_user is null then
    raise exception 'Please log in to book tickets' using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 10 then
    raise exception 'You can book between 1 and 10 tickets at a time';
  end if;

  perform public.release_expired_holds();

  select * into v_type from public.ticket_types where id = p_ticket_type_id;
  if not found then raise exception 'Ticket type not found'; end if;

  select * into v_event from public.events where id = v_type.event_id;
  if v_event.status <> 'published' then raise exception 'This event is not open for booking'; end if;
  if v_event.starts_at <= now() then raise exception 'This event has already started'; end if;
  if v_type.sale_starts_at is not null and v_type.sale_starts_at > now() then
    raise exception 'Ticket sales have not started yet';
  end if;
  if v_type.sale_ends_at is not null and v_type.sale_ends_at < now() then
    raise exception 'Ticket sales have ended';
  end if;

  update public.ticket_types
     set held = held + p_quantity
   where id = p_ticket_type_id
     and sold + held + p_quantity <= quantity;
  if not found then
    raise exception 'Not enough tickets left';
  end if;

  insert into public.bookings (user_id, event_id, ticket_type_id, quantity, unit_price, total_amount, hold_expires_at)
  values (v_user, v_event.id, v_type.id, p_quantity, v_type.price, v_type.price * p_quantity, now() + interval '10 minutes')
  returning id into v_booking;

  return v_booking;
end;
$$;

-- Confirms a held booking after the mock payment succeeds and issues one
-- ticket per seat. Calling it again for a confirmed booking does nothing, so
-- double-clicking "Pay" can never create extra tickets.
create or replace function public.confirm_booking_payment(p_booking_id uuid, p_method text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_title text;
begin
  if p_method not in ('card', 'upi') then raise exception 'Invalid payment method'; end if;

  select * into v_booking from public.bookings
   where id = p_booking_id and user_id = auth.uid()
   for update;
  if not found then raise exception 'Booking not found'; end if;

  if v_booking.status = 'confirmed' then
    return 'already_confirmed';
  end if;
  if v_booking.status <> 'held' then
    raise exception 'This booking is no longer active (status: %)', v_booking.status;
  end if;
  if v_booking.hold_expires_at < now() then
    update public.bookings set status = 'expired' where id = v_booking.id;
    update public.ticket_types set held = greatest(held - v_booking.quantity, 0) where id = v_booking.ticket_type_id;
    return 'expired';
  end if;

  update public.ticket_types
     set held = greatest(held - v_booking.quantity, 0),
         sold = sold + v_booking.quantity
   where id = v_booking.ticket_type_id;

  update public.bookings
     set status = 'confirmed',
         payment_method = p_method,
         payment_reference = 'MOCK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
         confirmed_at = now()
   where id = v_booking.id;

  insert into public.tickets (booking_id, event_id, ticket_type_id, user_id)
  select v_booking.id, v_booking.event_id, v_booking.ticket_type_id, v_booking.user_id
    from generate_series(1, v_booking.quantity);

  select title into v_title from public.events where id = v_booking.event_id;
  insert into public.notifications (user_id, title, body, link)
  values (v_booking.user_id, 'Booking confirmed',
          v_booking.quantity || ' ticket(s) for ' || v_title || ' are ready.',
          '/bookings/' || v_booking.id);

  return 'confirmed';
end;
$$;

-- Releases a hold when the mock payment fails or the user abandons checkout.
create or replace function public.cancel_booking_hold(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
begin
  select * into v_booking from public.bookings
   where id = p_booking_id and user_id = auth.uid()
   for update;
  if not found then raise exception 'Booking not found'; end if;
  if v_booking.status <> 'held' then return; end if;   -- already handled

  update public.bookings set status = 'cancelled', cancelled_at = now() where id = v_booking.id;
  update public.ticket_types set held = greatest(held - v_booking.quantity, 0) where id = v_booking.ticket_type_id;
end;
$$;

-- Attendee cancels a confirmed booking before the event starts.
-- Seats return to inventory exactly once. No refund is implied (mock payment).
create or replace function public.cancel_booking(p_booking_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_event public.events;
begin
  select * into v_booking from public.bookings
   where id = p_booking_id and user_id = auth.uid()
   for update;
  if not found then raise exception 'Booking not found'; end if;
  if v_booking.status = 'cancelled' then return 'already_cancelled'; end if;
  if v_booking.status <> 'confirmed' then raise exception 'Only confirmed bookings can be cancelled'; end if;

  select * into v_event from public.events where id = v_booking.event_id;
  if v_event.starts_at <= now() then raise exception 'Bookings cannot be cancelled after the event has started'; end if;
  if exists (select 1 from public.tickets where booking_id = v_booking.id and checked_in_at is not null) then
    raise exception 'A ticket in this booking has already been checked in';
  end if;

  update public.bookings set status = 'cancelled', cancelled_at = now() where id = v_booking.id;
  update public.tickets set status = 'cancelled' where booking_id = v_booking.id;
  update public.ticket_types set sold = greatest(sold - v_booking.quantity, 0) where id = v_booking.ticket_type_id;

  insert into public.notifications (user_id, title, body, link)
  values (v_booking.user_id, 'Booking cancelled', 'Your booking for ' || v_event.title || ' was cancelled.',
          '/bookings/' || v_booking.id);
  return 'cancelled';
end;
$$;


-- -----------------------------------------------------------------------------
-- 7. Check-in: one time only, organizer of the event (or admin) only
-- -----------------------------------------------------------------------------

create or replace function public.check_in_ticket(p_ticket_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.tickets;
  v_event public.events;
  v_type_name text;
  v_holder text;
begin
  select * into v_ticket from public.tickets where id = p_ticket_id for update;
  if not found then
    return jsonb_build_object('result', 'invalid');
  end if;

  select * into v_event from public.events where id = v_ticket.event_id;
  if v_event.organizer_id <> auth.uid() and not public.is_admin() then
    return jsonb_build_object('result', 'not_authorized');
  end if;

  select name into v_type_name from public.ticket_types where id = v_ticket.ticket_type_id;
  select full_name into v_holder from public.profiles where id = v_ticket.user_id;

  if v_event.status = 'cancelled' then
    return jsonb_build_object('result', 'event_cancelled', 'event', v_event.title);
  end if;
  if v_ticket.status = 'cancelled' then
    return jsonb_build_object('result', 'ticket_cancelled', 'event', v_event.title);
  end if;
  if v_ticket.checked_in_at is not null then
    return jsonb_build_object('result', 'already_checked_in', 'event', v_event.title,
                              'checked_in_at', v_ticket.checked_in_at, 'holder', v_holder, 'ticket_type', v_type_name);
  end if;
  if coalesce(v_event.ends_at, v_event.starts_at + interval '1 day') < now() then
    return jsonb_build_object('result', 'event_ended', 'event', v_event.title);
  end if;

  update public.tickets set checked_in_at = now(), checked_in_by = auth.uid() where id = v_ticket.id;
  return jsonb_build_object('result', 'checked_in', 'event', v_event.title,
                            'holder', v_holder, 'ticket_type', v_type_name, 'checked_in_at', now());
end;
$$;


-- -----------------------------------------------------------------------------
-- 8. Event lifecycle: submit -> admin review -> published; cancel
-- -----------------------------------------------------------------------------

create or replace function public.submit_event_for_review(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.organizer_id <> auth.uid() then raise exception 'Event not found'; end if;
  if public.current_user_role() <> 'organizer' then raise exception 'Only organizers can submit events'; end if;
  if v_event.status <> 'draft' then raise exception 'Only draft events can be submitted'; end if;
  if v_event.review_status = 'pending' then return; end if;
  if v_event.starts_at <= now() then raise exception 'The event date must be in the future'; end if;
  if not exists (select 1 from public.ticket_types where event_id = p_event_id) then
    raise exception 'Add at least one ticket type before submitting';
  end if;

  update public.events set review_status = 'pending', review_note = null where id = p_event_id;
end;
$$;

-- Admin approves (publishes) or rejects a pending event. Admins cannot review
-- their own events.
create or replace function public.review_event(p_event_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review events' using errcode = '42501';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found'; end if;
  if v_event.organizer_id = auth.uid() then raise exception 'You cannot review your own event'; end if;
  if v_event.review_status <> 'pending' then raise exception 'This event is not waiting for review'; end if;

  if p_approve then
    update public.events set review_status = 'approved', status = 'published', review_note = left(p_note, 500)
     where id = p_event_id;
    insert into public.notifications (user_id, title, body, link)
    values (v_event.organizer_id, 'Event approved', v_event.title || ' is now live.', '/organizer/events/' || v_event.id);
  else
    update public.events set review_status = 'rejected', review_note = left(p_note, 500)
     where id = p_event_id;
    insert into public.notifications (user_id, title, body, link)
    values (v_event.organizer_id, 'Event needs changes',
            v_event.title || ' was not approved' || coalesce(': ' || left(p_note, 200), '.'),
            '/organizer/events/' || v_event.id);
  end if;
end;
$$;

-- Cancels an event: cancels confirmed bookings and tickets, releases holds and
-- notifies every affected attendee in-app. Safe to call twice.
create or replace function public.cancel_event(p_event_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found'; end if;
  if v_event.organizer_id <> auth.uid() and not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if v_event.status = 'cancelled' then return; end if;

  update public.events set status = 'cancelled', cancel_reason = left(p_reason, 500) where id = p_event_id;

  insert into public.notifications (user_id, title, body, link)
  select distinct b.user_id, 'Event cancelled',
         v_event.title || ' has been cancelled' || coalesce(': ' || left(p_reason, 200), '.'),
         '/bookings/' || b.id
    from public.bookings b
   where b.event_id = p_event_id and b.status = 'confirmed';

  update public.tickets set status = 'cancelled' where event_id = p_event_id;
  update public.bookings set status = 'cancelled', cancelled_at = now()
   where event_id = p_event_id and status in ('confirmed', 'held');
  update public.ticket_types set held = 0, sold = 0 where event_id = p_event_id;
end;
$$;


-- -----------------------------------------------------------------------------
-- 9. Admin: user roles and platform stats
-- -----------------------------------------------------------------------------

-- Admins switch users between attendee and organizer. Nobody can grant the
-- admin role from the app, and admins cannot change their own role.
create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Only admins can change roles' using errcode = '42501'; end if;
  if p_user_id = auth.uid() then raise exception 'You cannot change your own role'; end if;
  if p_role = 'admin' then raise exception 'Admin role can only be granted in the database'; end if;
  if exists (select 1 from public.profiles where id = p_user_id and role = 'admin') then
    raise exception 'Admin accounts cannot be changed here';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
end;
$$;

create or replace function public.admin_platform_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Only admins can view stats' using errcode = '42501'; end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'organizers', (select count(*) from public.profiles where role = 'organizer'),
    'events_published', (select count(*) from public.events where status = 'published'),
    'events_pending', (select count(*) from public.events where review_status = 'pending'),
    'bookings_confirmed', (select count(*) from public.bookings where status = 'confirmed'),
    'tickets_sold', (select count(*) from public.tickets where status = 'valid'),
    'revenue', (select coalesce(sum(total_amount), 0) from public.bookings where status = 'confirmed'),
    'checked_in', (select count(*) from public.tickets where checked_in_at is not null)
  );
end;
$$;

-- Admins can list users with their emails (profiles has no email column).
create or replace function public.admin_list_users()
returns table (id uuid, full_name text, email text, role public.app_role, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Only admins can list users' using errcode = '42501'; end if;
  return query
    select p.id, p.full_name, u.email::text, p.role, p.created_at
      from public.profiles p join auth.users u on u.id = p.id
     order by p.created_at desc;
end;
$$;


-- -----------------------------------------------------------------------------
-- 10. Function permissions
-- -----------------------------------------------------------------------------

revoke execute on function public.release_expired_holds() from public, anon;
revoke execute on function public.is_event_organizer(uuid) from public, anon;
revoke execute on function public.create_booking_hold(uuid, integer) from public, anon;
revoke execute on function public.confirm_booking_payment(uuid, text) from public, anon;
revoke execute on function public.cancel_booking_hold(uuid) from public, anon;
revoke execute on function public.cancel_booking(uuid) from public, anon;
revoke execute on function public.check_in_ticket(uuid) from public, anon;
revoke execute on function public.submit_event_for_review(uuid) from public, anon;
revoke execute on function public.review_event(uuid, boolean, text) from public, anon;
revoke execute on function public.cancel_event(uuid, text) from public, anon;
revoke execute on function public.admin_set_user_role(uuid, public.app_role) from public, anon;
revoke execute on function public.admin_platform_stats() from public, anon;
revoke execute on function public.admin_list_users() from public, anon;

grant execute on function public.release_expired_holds() to authenticated;
grant execute on function public.is_event_organizer(uuid) to authenticated;
grant execute on function public.create_booking_hold(uuid, integer) to authenticated;
grant execute on function public.confirm_booking_payment(uuid, text) to authenticated;
grant execute on function public.cancel_booking_hold(uuid) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.check_in_ticket(uuid) to authenticated;
grant execute on function public.submit_event_for_review(uuid) to authenticated;
grant execute on function public.review_event(uuid, boolean, text) to authenticated;
grant execute on function public.cancel_event(uuid, text) to authenticated;
grant execute on function public.admin_set_user_role(uuid, public.app_role) to authenticated;
grant execute on function public.admin_platform_stats() to authenticated;
grant execute on function public.admin_list_users() to authenticated;


-- -----------------------------------------------------------------------------
-- 11. Storage bucket for event banners (public read, owner-folder write)
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-banners', 'event-banners', true, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Organizers upload banners to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'event-banners' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Anyone can read event banners"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'event-banners');
