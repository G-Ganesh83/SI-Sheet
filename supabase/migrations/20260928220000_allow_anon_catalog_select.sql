-- ==============================================================================
-- SI Sheet - Allow Anonymous SELECT on Shared Catalog Tables
-- Migration: 20260928220000_allow_anon_catalog_select.sql
--
-- Purpose: Change catalog tables (problems, topics, problem_topics, labs,
--          lab_problems) from authenticated-only SELECT to public SELECT so
--          unauthenticated visitors can browse the SI Sheet.
--
-- Security invariants preserved:
--   - Anonymous users get SELECT only — no INSERT/UPDATE/DELETE.
--   - user_progress and profiles remain strictly authenticated + user_id scoped.
--   - Admin write policies are unchanged.
-- ==============================================================================

-- 1. Drop existing authenticated-only SELECT policies on catalog tables
drop policy if exists "Authenticated users can select problems" on public.problems;
drop policy if exists "Authenticated users can select topics" on public.topics;
drop policy if exists "Authenticated users can select problem_topics" on public.problem_topics;
drop policy if exists "Authenticated users can select labs" on public.labs;
drop policy if exists "Authenticated users can select lab_problems" on public.lab_problems;

-- 2. Recreate SELECT policies allowing both anon and authenticated roles
create policy "Anyone can select problems"
  on public.problems
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can select topics"
  on public.topics
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can select problem_topics"
  on public.problem_topics
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can select labs"
  on public.labs
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can select lab_problems"
  on public.lab_problems
  for select
  to anon, authenticated
  using (true);

-- 3. Grant SELECT on catalog tables to anon role (was previously revoked)
grant usage on schema public to anon;
grant select on public.problems to anon;
grant select on public.topics to anon;
grant select on public.problem_topics to anon;
grant select on public.labs to anon;
grant select on public.lab_problems to anon;

-- 4. Verify: anon must NOT have write access to any table (implicit via revoke
--    in initial migration + no INSERT/UPDATE/DELETE policies for anon).
--    user_progress and profiles policies remain unchanged: authenticated only.
