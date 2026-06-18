-- ZBPrayerApp — initial Supabase schema (idempotent — safe to re-run)
-- Run in Supabase SQL Editor or via: supabase db push
--
-- Model: anyone can READ prayer requests and tap "I prayed" (count goes up via
-- a SECURITY DEFINER rpc). Only ADMINS can create/edit/delete prayer points.
-- Admin status lives in public.profiles.is_admin.

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prayer_events (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- One row per auth user; is_admin gates write access to prayer points.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists prayer_requests_category_idx
  on public.prayer_requests (category);

create index if not exists prayer_requests_subcategory_idx
  on public.prayer_requests (subcategory);

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

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- RPC: atomically increment prayer count (+ event log). Anyone may call this.
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
  where id = request_id
  returning prayer_count into new_count;

  if new_count is null then
    raise exception 'Prayer request not found: %', request_id;
  end if;

  insert into public.prayer_events (prayer_request_id, user_id)
  values (request_id, auth.uid());

  return new_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.prayer_requests enable row level security;
alter table public.prayer_events enable row level security;
alter table public.profiles enable row level security;

-- prayer_requests: public read, admin-only write.
drop policy if exists "Anyone can read prayer requests" on public.prayer_requests;
create policy "Anyone can read prayer requests"
  on public.prayer_requests for select
  using (true);

drop policy if exists "Admins can insert prayer requests" on public.prayer_requests;
create policy "Admins can insert prayer requests"
  on public.prayer_requests for insert
  with check (public.is_admin());

drop policy if exists "Admins can update prayer requests" on public.prayer_requests;
create policy "Admins can update prayer requests"
  on public.prayer_requests for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete prayer requests" on public.prayer_requests;
create policy "Admins can delete prayer requests"
  on public.prayer_requests for delete
  using (public.is_admin());

-- prayer_events: readable, but only written via the rpc (no direct inserts).
drop policy if exists "Anyone can read prayer events" on public.prayer_events;
create policy "Anyone can read prayer events"
  on public.prayer_events for select
  using (true);

drop policy if exists "No direct prayer event inserts" on public.prayer_events;
create policy "No direct prayer event inserts"
  on public.prayer_events for insert
  with check (false);

-- profiles: a user can read/update only their own row.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant execute on function public.increment_prayer_count(uuid) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Make yourself an admin (run once, after signing in at least once):
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@example.com');
-- ---------------------------------------------------------------------------
