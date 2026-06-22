-- 00003 — ensure_profile(): create the caller's profile row on first login.
-- Run this in the Supabase SQL Editor.
--
-- Why: the app calls this right after sign-in. It guarantees a profiles row
-- exists even if the auth.users signup trigger couldn't be created (some
-- Supabase projects block triggers on auth.users). SECURITY DEFINER lets it
-- insert past RLS. New users start as 'member'.

create or replace function public.ensure_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  insert into public.profiles (id)
  values (auth.uid())
  on conflict (id) do nothing;
end;
$$;

grant execute on function public.ensure_profile() to authenticated;
