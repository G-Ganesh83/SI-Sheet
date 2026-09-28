-- ==============================================================================
-- SI Sheet - Supabase RLS Security Verification Tests (pgTAP)
-- Test file: supabase/tests/rls_security_test.sql
-- Run with: supabase test db (or execute against Postgres instance with pgTAP enabled)
-- ==============================================================================

begin;

-- Load pgTAP extension if available
create extension if not exists pgtap;

select plan(24);

-- ------------------------------------------------------------------------------
-- 1. Verify Extension & Schema Setup
-- ------------------------------------------------------------------------------
select has_schema('public', 'Schema public should exist');
select has_schema('private', 'Schema private should exist');
select has_table('public', 'profiles', 'Table public.profiles should exist');
select has_table('public', 'problems', 'Table public.problems should exist');
select has_table('public', 'topics', 'Table public.topics should exist');
select has_table('public', 'problem_topics', 'Table public.problem_topics should exist');
select has_table('public', 'labs', 'Table public.labs should exist');
select has_table('public', 'lab_problems', 'Table public.lab_problems should exist');
select has_table('public', 'user_progress', 'Table public.user_progress should exist');

-- ------------------------------------------------------------------------------
-- 2. Verify RLS is Enabled on Every Table
-- ------------------------------------------------------------------------------
select row_security_is('public', 'profiles', 'ON', 'RLS should be ON for public.profiles');
select row_security_is('public', 'problems', 'ON', 'RLS should be ON for public.problems');
select row_security_is('public', 'topics', 'ON', 'RLS should be ON for public.topics');
select row_security_is('public', 'problem_topics', 'ON', 'RLS should be ON for public.problem_topics');
select row_security_is('public', 'labs', 'ON', 'RLS should be ON for public.labs');
select row_security_is('public', 'lab_problems', 'ON', 'RLS should be ON for public.lab_problems');
select row_security_is('public', 'user_progress', 'ON', 'RLS should be ON for public.user_progress');

-- ------------------------------------------------------------------------------
-- 3. Anonymous Access Tests (Must be completely rejected)
-- ------------------------------------------------------------------------------
set local role anon;
select throws_ok(
  'select * from public.problems',
  '42501',
  NULL,
  'Anon cannot select from problems'
);

select throws_ok(
  'select * from public.user_progress',
  '42501',
  NULL,
  'Anon cannot select from user_progress'
);

select throws_ok(
  'select * from public.profiles',
  '42501',
  NULL,
  'Anon cannot select from profiles'
);

-- ------------------------------------------------------------------------------
-- 4. User Isolation & Catalog Access Test Fixtures
-- ------------------------------------------------------------------------------
reset role;

-- Create mock auth users
do $$
declare
  user_a_id uuid := '11111111-1111-1111-1111-111111111111';
  user_b_id uuid := '22222222-2222-2222-2222-222222222222';
  admin_id  uuid := '99999999-9999-9999-9999-999999999999';
begin
  -- Insert into auth.users (if in local Supabase test environment)
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    insert into auth.users (id, email)
    values
      (user_a_id, 'user_a@example.com'),
      (user_b_id, 'user_b@example.com'),
      (admin_id,  'admin@example.com')
    on conflict (id) do nothing;
  end if;

  -- Create profiles
  insert into public.profiles (user_id, display_name, role)
  values
    (user_a_id, 'User A', 'user'),
    (user_b_id, 'User B', 'user'),
    (admin_id,  'Admin User', 'admin')
  on conflict (user_id) do nothing;
end $$;

-- ------------------------------------------------------------------------------
-- 5. Role Escalation Protection Test
-- ------------------------------------------------------------------------------
-- Test that normal users cannot update their own role to 'admin'
set local role authenticated;
set local "request.jwt.claim.sub" to '11111111-1111-1111-1111-111111111111';

select throws_ok(
  $$update public.profiles set role = 'admin' where user_id = '11111111-1111-1111-1111-111111111111'$$,
  'Unauthorized: Only administrators can modify roles.',
  'Regular user cannot escalate role to admin'
);

-- ------------------------------------------------------------------------------
-- 6. Shared Catalog Modification Protection for Normal Users
-- ------------------------------------------------------------------------------
select throws_ok(
  $$insert into public.problems (title, url, platform) values ('Hacked Problem', 'https://example.com/hacked', 'LeetCode')$$,
  '42501',
  NULL,
  'Regular user cannot insert into shared problems catalog'
);

-- ------------------------------------------------------------------------------
-- 7. Admin Shared Catalog Modification
-- ------------------------------------------------------------------------------
set local "request.jwt.claim.sub" to '99999999-9999-9999-9999-999999999999';
select lives_ok(
  $$insert into public.problems (title, url, platform) values ('Admin Problem', 'https://example.com/admin-test', 'Smart Interviews')$$,
  'Admin user can insert into shared problems catalog'
);

-- Clean up and finish
rollback;
