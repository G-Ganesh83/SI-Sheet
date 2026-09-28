-- ==============================================================================
-- SI Sheet - Footer Click Analytics Migration
-- Migration: 20260928230000_create_footer_clicks.sql
-- ==============================================================================

-- 1. Create table public.footer_clicks
-- Only records user_id (null for anonymous) and click timestamps.
-- Strictly NO IP addresses, fingerprints, device tracking, or sensitive data.
create table if not exists public.footer_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  clicked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 2. Performance Indexes
create index if not exists idx_footer_clicks_clicked_at on public.footer_clicks(clicked_at desc);
create index if not exists idx_footer_clicks_user_id on public.footer_clicks(user_id);

-- 3. Enable Row Level Security (RLS)
alter table public.footer_clicks enable row level security;

-- 4. Revoke all direct privileges from public and anon
revoke all on public.footer_clicks from anon, public;

-- 5. Grant required permissions to authenticated users (controlled strictly by RLS)
grant usage on schema public to authenticated;
grant select on public.footer_clicks to authenticated;

-- 6. RLS Policy: Admins only can select footer_clicks
-- Normal users and anonymous visitors cannot read any click records.
create policy "Admins can select footer_clicks"
  on public.footer_clicks
  for select
  to authenticated
  using (private.is_admin());
