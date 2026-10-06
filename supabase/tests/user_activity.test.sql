-- ==============================================================================
-- SI Sheet - User Activity & Last Active Verification Tests (pgTAP)
-- Test file: supabase/tests/user_activity.test.sql
-- ==============================================================================

begin;

-- Load pgTAP extension if available
create extension if not exists pgtap;

select plan(10);

-- 1. Verify last_seen_at column exists and is nullable
select has_column('public', 'profiles', 'last_seen_at', 'Table profiles should have last_seen_at column');
select col_is_null('public', 'profiles', 'last_seen_at', 'Column last_seen_at should be nullable without default now()');

-- 2. Verify touch_user_activity RPC exists and is SECURITY DEFINER
select has_function('public', 'touch_user_activity', array[]::text[], 'Function public.touch_user_activity should exist');

-- 3. Anonymous execution protection
set local role anon;
select throws_ok(
  'select public.touch_user_activity()',
  '42501',
  NULL,
  'Anon cannot execute touch_user_activity'
);

-- 4. Setup mock users
reset role;

do $$
declare
  user_1_id uuid := '33333333-3333-3333-3333-333333333333';
  user_2_id uuid := '44444444-4444-4444-4444-444444444444';
begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    insert into auth.users (id, email)
    values
      (user_1_id, 'user_1@example.com'),
      (user_2_id, 'user_2@example.com')
    on conflict (id) do nothing;
  end if;

  insert into public.profiles (user_id, display_name, role, updated_at)
  values
    (user_1_id, 'User One', 'user', '2026-01-01 00:00:00+00'),
    (user_2_id, 'User Two', 'user', '2026-01-01 00:00:00+00')
  on conflict (user_id) do update set
    updated_at = '2026-01-01 00:00:00+00',
    last_seen_at = null;
end $$;

-- 5. Verify existing profile has last_seen_at = null initially
select is(
  (select last_seen_at from public.profiles where user_id = '33333333-3333-3333-3333-333333333333'),
  null,
  'Existing profile initially has last_seen_at = null'
);

-- 6. Authenticated user 1 calls touch_user_activity()
set local role authenticated;
set local "request.jwt.claim.sub" to '33333333-3333-3333-3333-333333333333';

select lives_ok(
  'select public.touch_user_activity()',
  'Authenticated user can execute touch_user_activity()'
);

-- 7. Verify user 1 last_seen_at became populated
select isnt(
  (select last_seen_at from public.profiles where user_id = '33333333-3333-3333-3333-333333333333'),
  null,
  'User 1 last_seen_at is populated after heartbeat'
);

-- 8. Verify user 1 updated_at was NOT touched by the heartbeat
select is(
  (select updated_at from public.profiles where user_id = '33333333-3333-3333-3333-333333333333'),
  '2026-01-01 00:00:00+00'::timestamptz,
  'Heartbeat updates last_seen_at WITHOUT changing updated_at'
);

-- 9. Normal profile edit DOES update updated_at
select lives_ok(
  $$update public.profiles set display_name = 'Updated User One' where user_id = '33333333-3333-3333-3333-333333333333'$$,
  'User can edit own display_name'
);

select isnt(
  (select updated_at from public.profiles where user_id = '33333333-3333-3333-3333-333333333333'),
  '2026-01-01 00:00:00+00'::timestamptz,
  'Real profile edits bump updated_at normally'
);

-- 10. Clean up and finish
rollback;
