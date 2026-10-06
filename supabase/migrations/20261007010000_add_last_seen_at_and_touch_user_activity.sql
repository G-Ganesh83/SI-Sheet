-- ==============================================================================
-- SI Sheet - Add last_seen_at and touch_user_activity RPC
-- Migration: 20261007010000_add_last_seen_at_and_touch_user_activity.sql
--
-- Adds nullable last_seen_at to public.profiles (without DEFAULT now() so existing
-- rows remain NULL until active observation), modifies profile updated_at trigger
-- so activity heartbeats do not touch updated_at, and creates the SECURITY DEFINER
-- public.touch_user_activity() stored procedure.
-- ==============================================================================

-- 1. Add nullable last_seen_at column to public.profiles
-- Existing profiles intentionally remain NULL until observed active.
alter table public.profiles
  add column if not exists last_seen_at timestamptz default null;

-- Secondary index for querying / sorting by user activity
create index if not exists idx_profiles_last_seen_at
  on public.profiles(last_seen_at desc nulls last);

-- 2. Dedicated profile updated_at trigger function
-- Preserves updated_at semantics: only real profile edits (display_name, avatar_url, role)
-- bump updated_at. Pure last_seen_at heartbeats preserve existing updated_at.
create or replace function public.handle_profile_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- If ONLY last_seen_at changed and other profile fields remained untouched, preserve old updated_at
  if (new.last_seen_at is distinct from old.last_seen_at)
     and (new.display_name is not distinct from old.display_name)
     and (new.avatar_url is not distinct from old.avatar_url)
     and (new.role is not distinct from old.role)
     and (new.user_id is not distinct from old.user_id)
     and (new.id is not distinct from old.id) then
    new.updated_at = old.updated_at;
  else
    new.updated_at = now();
  end if;
  return new;
end;
$$;

-- Replace trigger on public.profiles to use dedicated handler
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_profile_updated_at();

-- 3. Secure activity heartbeat RPC
-- Operates strictly on auth.uid() with search_path = ''.
-- Accepts no parameters to prevent caller impersonation or column tampering.
create or replace function public.touch_user_activity()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return;
  end if;

  update public.profiles
  set last_seen_at = now()
  where user_id = v_user_id;
end;
$$;

-- 4. Function permissions
revoke all on function public.touch_user_activity() from public;
revoke all on function public.touch_user_activity() from anon;
grant execute on function public.touch_user_activity() to authenticated;

-- 5. Reload PostgREST schema cache
notify pgrst, 'reload schema';
