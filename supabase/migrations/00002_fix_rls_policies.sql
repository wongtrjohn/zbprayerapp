-- 00002 — Ensure all RLS policies exist.
-- Fixes: "new row violates row-level security policy" when submitting a request.
-- Cause: the first run of 00001 applied the tables but not all policies
-- (commonly because the auth.users trigger statement halted the script).
-- This file is idempotent and safe to run any number of times.
-- Run it in the Supabase SQL Editor.

alter table public.prayer_requests enable row level security;
alter table public.prayer_events   enable row level security;
alter table public.profiles        enable row level security;

-- ---- prayer_requests ------------------------------------------------------
drop policy if exists "Public can read approved requests" on public.prayer_requests;
create policy "Public can read approved requests"
  on public.prayer_requests for select
  using (status = 'approved');

drop policy if exists "Approvers can read all requests" on public.prayer_requests;
create policy "Approvers can read all requests"
  on public.prayer_requests for select
  using (public.is_approver());

drop policy if exists "Anyone can submit pending requests" on public.prayer_requests;
create policy "Anyone can submit pending requests"
  on public.prayer_requests for insert
  with check (status = 'pending');

drop policy if exists "Approvers can update requests" on public.prayer_requests;
create policy "Approvers can update requests"
  on public.prayer_requests for update
  using (public.is_approver())
  with check (public.is_approver());

drop policy if exists "Admins can delete requests" on public.prayer_requests;
create policy "Admins can delete requests"
  on public.prayer_requests for delete
  using (public.is_admin());

-- ---- prayer_events --------------------------------------------------------
drop policy if exists "Anyone can read prayer events" on public.prayer_events;
create policy "Anyone can read prayer events"
  on public.prayer_events for select
  using (true);

drop policy if exists "No direct prayer event inserts" on public.prayer_events;
create policy "No direct prayer event inserts"
  on public.prayer_events for insert
  with check (false);

-- ---- profiles -------------------------------------------------------------
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own display name" on public.profiles;
create policy "Users can update own display name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

-- ---- grants ---------------------------------------------------------------
grant execute on function public.increment_prayer_count(uuid) to anon, authenticated;
grant execute on function public.set_prayer_status(uuid, text) to authenticated;
grant execute on function public.is_approver() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
