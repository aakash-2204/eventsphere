-- =============================================================================
-- EventSphere demo seed data (fictional events, venues and organizers).
--
-- Before running: replace ORGANIZER_EMAIL_HERE below with the email of an
-- account that ALREADY exists and has the 'organizer' role (approve it from
-- /admin/organizer-requests, or see docs/SETUP.md). The seed never changes
-- anyone's role and never touches other users' data.
--
-- Safe to run more than once: every row has a fixed id and uses
-- "on conflict do nothing".
-- =============================================================================

do $$
declare
  v_org uuid;
begin
  select p.id into v_org
    from public.profiles p
    join auth.users u on u.id = p.id
   where lower(u.email) = lower('ORGANIZER_EMAIL_HERE')
     and p.role = 'organizer';

  if v_org is null then
    raise exception 'No organizer found with that email. Create the account, make it an organizer, then run this again.';
  end if;

  insert into public.events
    (id, organizer_id, title, description, category, venue, city, starts_at, ends_at, capacity, price_from,
     status, review_status, is_online, online_url)
  values
    ('a0000000-0000-4000-8000-000000000001', v_org, 'Monsoon Beats Live: Indie Night',
     'An evening of independent bands from across India, with food stalls and a late-night acoustic set.',
     'music', 'Phoenix Arena', 'Mumbai', '2026-11-14 19:00+05:30', '2026-11-14 23:30+05:30', 500, 1499, 'published', 'approved', false, null),
    ('a0000000-0000-4000-8000-000000000002', v_org, 'Bengaluru DevSummit 2026',
     'Two tracks of talks on web platforms, cloud and AI tooling, plus hands-on workshops and a hiring lounge.',
     'tech', 'KTPO Convention Centre', 'Bengaluru', '2026-11-21 09:30+05:30', '2026-11-21 18:00+05:30', 800, 2499, 'published', 'approved', false, null),
    ('a0000000-0000-4000-8000-000000000003', v_org, 'Delhi Winter Half Marathon',
     'A 21 km route through central Delhi with 5 km and 10 km options. Timing chips and medals included.',
     'sports', 'Jawaharlal Nehru Stadium', 'New Delhi', '2026-12-06 05:45+05:30', '2026-12-06 11:00+05:30', 2000, 899, 'published', 'approved', false, null),
    ('a0000000-0000-4000-8000-000000000004', v_org, 'The Lost Letters — A Stage Play',
     'A moving two-act drama about a postman who reads the letters he cannot deliver.',
     'arts', 'Ranga Shankara', 'Bengaluru', '2026-11-28 18:30+05:30', '2026-11-28 21:00+05:30', 300, 600, 'published', 'approved', false, null),
    ('a0000000-0000-4000-8000-000000000005', v_org, 'Old Delhi Street Food Walk',
     'A guided three-hour walk through Chandni Chowk tasting chaat, parathas and jalebis.',
     'food', 'Chandni Chowk Meeting Point', 'New Delhi', '2026-11-15 16:00+05:30', '2026-11-15 19:00+05:30', 30, 1200, 'published', 'approved', false, null),
    ('a0000000-0000-4000-8000-000000000006', v_org, 'Founders Breakfast & Pitch Hour',
     'Early-stage founders pitch to a friendly panel over breakfast. Networking for builders and investors.',
     'business', 'Online', 'Online', '2026-12-03 08:00+05:30', '2026-12-03 10:00+05:30', 200, 0, 'published', 'approved', true, 'https://meet.example.com/founders-breakfast'),
    ('a0000000-0000-4000-8000-000000000007', v_org, 'Electronic Nights: Hyderabad',
     'Headline DJ sets, immersive visuals and a 5,000-capacity open-air dance floor.',
     'music', 'HITEX Exhibition Centre', 'Hyderabad', '2026-12-19 20:00+05:30', '2026-12-20 01:00+05:30', 5000, 2999, 'published', 'approved', false, null),
    ('a0000000-0000-4000-8000-000000000008', v_org, 'Design Systems Workshop',
     'A practical, laptop-required workshop on building and documenting a component library.',
     'tech', 'Online', 'Online', '2026-11-08 10:00+05:30', '2026-11-08 16:00+05:30', 60, 1799, 'published', 'approved', true, 'https://meet.example.com/design-systems'),
    ('a0000000-0000-4000-8000-000000000009', v_org, 'Kochi Seafood & Spice Festival',
     'Chef demos, a spice market and a sunset seafood feast on the backwaters.',
     'food', 'Marine Drive Grounds', 'Kochi', '2026-12-12 17:00+05:30', '2026-12-12 22:00+05:30', 400, 999, 'published', 'approved', false, null),
    ('a0000000-0000-4000-8000-000000000010', v_org, 'Pune Corporate Cricket Cup',
     'A one-day T10 tournament for office teams with live commentary and a family zone.',
     'sports', 'MCA Stadium', 'Pune', '2027-01-10 08:00+05:30', '2027-01-10 18:00+05:30', 1000, 499, 'draft', 'pending', false, null),
    ('a0000000-0000-4000-8000-000000000011', v_org, 'Contemporary Art Night Chennai',
     'A late opening of new works by emerging South Indian artists, with live music.',
     'arts', 'Lalit Kala Gallery', 'Chennai', '2027-01-16 18:00+05:30', '2027-01-16 22:00+05:30', 250, 350, 'draft', 'pending', false, null),
    ('a0000000-0000-4000-8000-000000000012', v_org, 'Startup Finance Masterclass',
     'Draft event: budgeting, fundraising basics and investor updates for first-time founders.',
     'business', 'WeWork Galaxy', 'Pune', '2027-01-23 10:00+05:30', '2027-01-23 13:00+05:30', 80, 1500, 'draft', 'not_submitted', false, null)
  on conflict (id) do nothing;

  insert into public.ticket_types (id, event_id, name, price, quantity, sale_ends_at)
  values
    ('b0000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000001', 'General Admission', 1499, 400, '2026-11-14 18:00+05:30'),
    ('b0000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000001', 'VIP', 3999, 100, '2026-11-14 18:00+05:30'),
    ('b0000000-0000-4000-8000-000000000201', 'a0000000-0000-4000-8000-000000000002', 'Conference Pass', 2499, 700, null),
    ('b0000000-0000-4000-8000-000000000202', 'a0000000-0000-4000-8000-000000000002', 'Conference + Workshop', 4499, 100, null),
    ('b0000000-0000-4000-8000-000000000301', 'a0000000-0000-4000-8000-000000000003', '21 km Half Marathon', 1499, 1000, '2026-12-01 23:59+05:30'),
    ('b0000000-0000-4000-8000-000000000302', 'a0000000-0000-4000-8000-000000000003', '10 km Run', 899, 1000, '2026-12-01 23:59+05:30'),
    ('b0000000-0000-4000-8000-000000000401', 'a0000000-0000-4000-8000-000000000004', 'Balcony', 600, 200, null),
    ('b0000000-0000-4000-8000-000000000402', 'a0000000-0000-4000-8000-000000000004', 'Front Stalls', 1200, 100, null),
    ('b0000000-0000-4000-8000-000000000501', 'a0000000-0000-4000-8000-000000000005', 'Walk + Tasting', 1200, 30, null),
    ('b0000000-0000-4000-8000-000000000601', 'a0000000-0000-4000-8000-000000000006', 'Free Online Seat', 0, 200, null),
    ('b0000000-0000-4000-8000-000000000701', 'a0000000-0000-4000-8000-000000000007', 'Early Bird', 2999, 3000, null),
    ('b0000000-0000-4000-8000-000000000702', 'a0000000-0000-4000-8000-000000000007', 'Fan Pit', 5999, 2000, null),
    ('b0000000-0000-4000-8000-000000000801', 'a0000000-0000-4000-8000-000000000008', 'Workshop Seat', 1799, 60, null),
    ('b0000000-0000-4000-8000-000000000901', 'a0000000-0000-4000-8000-000000000009', 'Festival Entry', 999, 300, null),
    ('b0000000-0000-4000-8000-000000000902', 'a0000000-0000-4000-8000-000000000009', 'Feast Table', 2499, 100, null),
    ('b0000000-0000-4000-8000-000000001001', 'a0000000-0000-4000-8000-000000000010', 'Team Entry (per player)', 499, 1000, null),
    ('b0000000-0000-4000-8000-000000001101', 'a0000000-0000-4000-8000-000000000011', 'Entry', 350, 250, null),
    ('b0000000-0000-4000-8000-000000001201', 'a0000000-0000-4000-8000-000000000012', 'Seat', 1500, 80, null)
  on conflict (id) do nothing;
end $$;
