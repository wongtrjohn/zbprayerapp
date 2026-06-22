-- ZBPrayerApp — initial Supabase schema (idempotent — safe to re-run)
-- Run in Supabase SQL Editor or via: supabase db push
--
-- Roles & moderation model
-- ------------------------
-- Three roles live in public.profiles.role:
--   'member'   (default) — can submit prayer requests; submissions start PENDING
--   'approver'            — can see pending requests and approve/reject them
--   'admin'               — approver rights + can delete / manage everything
--
-- prayer_requests.status is 'pending' | 'approved' | 'rejected'.
--   * The public ONLY ever sees 'approved' rows and can only pray for those.
--   * Anyone may submit a request, but only as 'pending' — you cannot self-publish.
--   * Approvers/admins flip status to 'approved' (that is the "approve" action).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('our-church', 'our-people', 'our-world')),
  subcategory text,
  description text not null,
  prayer_points text[] not null default '{}',
  source text not null default 'Zion Bishan Bulletin',
  source_url text,
  featured boolean not null default false,
  prayer_count integer not null default 0 check (prayer_count >= 0),
  week_of date,
  -- moderation
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_by uuid references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prayer_events (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- One row per auth user; `role` gates submit / approve / admin rights.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'member' check (role in ('member', 'approver', 'admin')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists prayer_requests_category_idx
  on public.prayer_requests (category);

create index if not exists prayer_requests_subcategory_idx
  on public.prayer_requests (subcategory);

create index if not exists prayer_requests_status_idx
  on public.prayer_requests (status);

create index if not exists prayer_requests_featured_idx
  on public.prayer_requests (featured) where featured = true;

create index if not exists prayer_requests_created_at_idx
  on public.prayer_requests (created_at desc);

create index if not exists prayer_events_prayer_request_id_idx
  on public.prayer_events (prayer_request_id);

-- Upsert key used by the bulletin scraper (/api/bulletin).
create unique index if not exists prayer_requests_title_week_key
  on public.prayer_requests (title, week_of);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prayer_requests_set_updated_at on public.prayer_requests;
create trigger prayer_requests_set_updated_at
  before update on public.prayer_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a user signs up
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helpers (SECURITY DEFINER so RLS on profiles doesn't block them).
create or replace function public.is_approver()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role in ('approver', 'admin') from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- RPC: atomically increment prayer count (+ event log).
-- Only works on APPROVED requests, so pending items can't be prayed for.
-- ---------------------------------------------------------------------------

create or replace function public.increment_prayer_count(request_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.prayer_requests
  set prayer_count = prayer_count + 1
  where id = request_id and status = 'approved'
  returning prayer_count into new_count;

  if new_count is null then
    raise exception 'Prayer request not found or not approved: %', request_id;
  end if;

  insert into public.prayer_events (prayer_request_id, user_id)
  values (request_id, auth.uid());

  return new_count;
end;
$$;

-- RPC: approve / reject a request (the "approve" action for approvers).
create or replace function public.set_prayer_status(request_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_approver() then
    raise exception 'Not authorised to review prayer requests';
  end if;
  if new_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Invalid status: %', new_status;
  end if;

  update public.prayer_requests
  set status = new_status,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = request_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.prayer_requests enable row level security;
alter table public.prayer_events enable row level security;
alter table public.profiles enable row level security;

-- prayer_requests: public sees approved only; approvers see everything.
drop policy if exists "Public can read approved requests" on public.prayer_requests;
create policy "Public can read approved requests"
  on public.prayer_requests for select
  using (status = 'approved');

drop policy if exists "Approvers can read all requests" on public.prayer_requests;
create policy "Approvers can read all requests"
  on public.prayer_requests for select
  using (public.is_approver());

-- Anyone may submit, but only as 'pending' (can't self-publish).
drop policy if exists "Anyone can submit pending requests" on public.prayer_requests;
create policy "Anyone can submit pending requests"
  on public.prayer_requests for insert
  with check (status = 'pending');

-- Approvers can edit / approve; admins can delete.
drop policy if exists "Approvers can update requests" on public.prayer_requests;
create policy "Approvers can update requests"
  on public.prayer_requests for update
  using (public.is_approver())
  with check (public.is_approver());

drop policy if exists "Admins can delete requests" on public.prayer_requests;
create policy "Admins can delete requests"
  on public.prayer_requests for delete
  using (public.is_admin());

-- prayer_events: readable, written only via the rpc (no direct inserts).
drop policy if exists "Anyone can read prayer events" on public.prayer_events;
create policy "Anyone can read prayer events"
  on public.prayer_events for select
  using (true);

drop policy if exists "No direct prayer event inserts" on public.prayer_events;
create policy "No direct prayer event inserts"
  on public.prayer_events for insert
  with check (false);

-- profiles: a user reads/updates only their own row. Note: a member cannot
-- change their own `role` to escalate — role changes are done by an admin via
-- the dashboard or the service-role key (see below).
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own display name" on public.profiles;
create policy "Users can update own display name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

grant execute on function public.increment_prayer_count(uuid) to anon, authenticated;
grant execute on function public.set_prayer_status(uuid, text) to authenticated;
grant execute on function public.is_approver() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Grant approve / admin rights (run in SQL Editor after the person has signed
-- in at least once so their profile row exists):
--
--   update public.profiles set role = 'approver'
--   where id = (select id from auth.users where email = 'approver@example.com');
--
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
-- ---------------------------------------------------------------------------
