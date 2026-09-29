-- ==============================================================================
-- SI Sheet - Restore Anonymous SELECT Privileges on Catalog Tables
-- Migration: 20260929140000_restore_anon_catalog_select.sql
--
-- Purpose: Ensure the PostgreSQL `anon` role has table-level SELECT privileges
--          on shared catalog tables so that anonymous visitors can browse
--          problems and topics.
--
-- Security invariants preserved:
--   - SELECT only on catalog tables.
--   - NO write privileges (INSERT, UPDATE, DELETE, TRUNCATE) to anon.
--   - NO access granted to profiles, user_progress, or footer_clicks.
--   - Works together with existing RLS policies.
-- ==============================================================================

grant usage on schema public to anon;

grant select on table
  public.problems,
  public.topics,
  public.problem_topics,
  public.labs,
  public.lab_problems
to anon;
