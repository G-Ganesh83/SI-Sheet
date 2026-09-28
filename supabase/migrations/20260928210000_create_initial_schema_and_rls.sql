-- ==============================================================================
-- SI Sheet - Supabase Initial Database Schema & Row Level Security (RLS)
-- Migration: 20260928210000_create_initial_schema_and_rls.sql
-- ==============================================================================

-- Enable standard pgcrypto extension for UUID generation
create extension if not exists "pgcrypto";

-- ==============================================================================
-- PART 0: Private Internal Schema for Security Definer Functions
-- ==============================================================================
create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

-- ==============================================================================
-- PART 1: Core Tables
-- ==============================================================================

-- 1. profiles: Application user profile corresponding to auth.users
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. problems: Global shared problem catalog
create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null unique,
  platform text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. topics: Global shared topic catalog
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- 4. problem_topics: Many-to-many relationship between problems and topics
create table if not exists public.problem_topics (
  problem_id uuid not null references public.problems(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  primary key (problem_id, topic_id)
);

-- 5. labs: Global lab-date catalog
create table if not exists public.labs (
  id uuid primary key default gen_random_uuid(),
  lab_date date not null unique,
  title text,
  created_at timestamptz not null default now()
);

-- 6. lab_problems: Many-to-many relationship between labs and problems
create table if not exists public.lab_problems (
  lab_id uuid not null references public.labs(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  primary key (lab_id, problem_id)
);

-- 7. user_progress: Private per-user problem progress tracking
create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  revision boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_progress_user_problem_unique unique (user_id, problem_id)
);

-- ==============================================================================
-- PART 2: Secondary Indexes
-- ==============================================================================
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_user_progress_user_id on public.user_progress(user_id);
create index if not exists idx_user_progress_problem_id on public.user_progress(problem_id);
create index if not exists idx_problem_topics_topic_id on public.problem_topics(topic_id);
create index if not exists idx_lab_problems_problem_id on public.lab_problems(problem_id);

-- ==============================================================================
-- PART 3: Updated-At Timestamp Triggers
-- ==============================================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_problems_updated_at on public.problems;
create trigger trg_problems_updated_at
  before update on public.problems
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_user_progress_updated_at on public.user_progress;
create trigger trg_user_progress_updated_at
  before update on public.user_progress
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- PART 4: Secure Admin Authorization Helper
-- ==============================================================================
create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(
    (
      select (role = 'admin')
      from public.profiles
      where user_id = auth.uid()
    ),
    false
  );
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.is_admin() from anon;
grant execute on function private.is_admin() to authenticated;

-- Prevent non-admin users from escalating their own or other users' roles
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not private.is_admin() then
    raise exception 'Unauthorized: Only administrators can modify roles.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ==============================================================================
-- PART 5: Enable Row Level Security (RLS) on All Application Tables
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.problems enable row level security;
alter table public.topics enable row level security;
alter table public.problem_topics enable row level security;
alter table public.labs enable row level security;
alter table public.lab_problems enable row level security;
alter table public.user_progress enable row level security;

-- ==============================================================================
-- PART 6: Row Level Security Policies
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 6.1 profiles
-- ------------------------------------------------------------------------------
create policy "Authenticated users can select own profile or admin"
  on public.profiles
  for select
  to authenticated
  using (user_id = auth.uid() or private.is_admin());

create policy "Authenticated users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (user_id = auth.uid() and role = 'user');

create policy "Authenticated users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (user_id = auth.uid() or private.is_admin())
  with check (user_id = auth.uid() or private.is_admin());

-- ------------------------------------------------------------------------------
-- 6.2 user_progress (Private Per-User Tracking)
-- ------------------------------------------------------------------------------
create policy "Users can select own progress"
  on public.user_progress
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own progress"
  on public.user_progress
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own progress"
  on public.user_progress
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own progress"
  on public.user_progress
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 6.3 Shared Catalog: problems
-- ------------------------------------------------------------------------------
create policy "Authenticated users can select problems"
  on public.problems
  for select
  to authenticated
  using (true);

create policy "Admins can insert problems"
  on public.problems
  for insert
  to authenticated
  with check (private.is_admin());

create policy "Admins can update problems"
  on public.problems
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "Admins can delete problems"
  on public.problems
  for delete
  to authenticated
  using (private.is_admin());

-- ------------------------------------------------------------------------------
-- 6.4 Shared Catalog: topics
-- ------------------------------------------------------------------------------
create policy "Authenticated users can select topics"
  on public.topics
  for select
  to authenticated
  using (true);

create policy "Admins can insert topics"
  on public.topics
  for insert
  to authenticated
  with check (private.is_admin());

create policy "Admins can update topics"
  on public.topics
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "Admins can delete topics"
  on public.topics
  for delete
  to authenticated
  using (private.is_admin());

-- ------------------------------------------------------------------------------
-- 6.5 Shared Catalog: problem_topics
-- ------------------------------------------------------------------------------
create policy "Authenticated users can select problem_topics"
  on public.problem_topics
  for select
  to authenticated
  using (true);

create policy "Admins can insert problem_topics"
  on public.problem_topics
  for insert
  to authenticated
  with check (private.is_admin());

create policy "Admins can update problem_topics"
  on public.problem_topics
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "Admins can delete problem_topics"
  on public.problem_topics
  for delete
  to authenticated
  using (private.is_admin());

-- ------------------------------------------------------------------------------
-- 6.6 Shared Catalog: labs
-- ------------------------------------------------------------------------------
create policy "Authenticated users can select labs"
  on public.labs
  for select
  to authenticated
  using (true);

create policy "Admins can insert labs"
  on public.labs
  for insert
  to authenticated
  with check (private.is_admin());

create policy "Admins can update labs"
  on public.labs
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "Admins can delete labs"
  on public.labs
  for delete
  to authenticated
  using (private.is_admin());

-- ------------------------------------------------------------------------------
-- 6.7 Shared Catalog: lab_problems
-- ------------------------------------------------------------------------------
create policy "Authenticated users can select lab_problems"
  on public.lab_problems
  for select
  to authenticated
  using (true);

create policy "Admins can insert lab_problems"
  on public.lab_problems
  for insert
  to authenticated
  with check (private.is_admin());

create policy "Admins can update lab_problems"
  on public.lab_problems
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "Admins can delete lab_problems"
  on public.lab_problems
  for delete
  to authenticated
  using (private.is_admin());

-- ==============================================================================
-- PART 7: Explicit Table Grants
-- ==============================================================================

-- Revoke all direct privileges on application tables from anon and public
revoke all on public.profiles from anon, public;
revoke all on public.problems from anon, public;
revoke all on public.topics from anon, public;
revoke all on public.problem_topics from anon, public;
revoke all on public.labs from anon, public;
revoke all on public.lab_problems from anon, public;
revoke all on public.user_progress from anon, public;

-- Grant required permissions to authenticated users (access strictly controlled by RLS policies)
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.user_progress to authenticated;

grant select on public.problems to authenticated;
grant insert, update, delete on public.problems to authenticated;

grant select on public.topics to authenticated;
grant insert, update, delete on public.topics to authenticated;

grant select on public.problem_topics to authenticated;
grant insert, update, delete on public.problem_topics to authenticated;

grant select on public.labs to authenticated;
grant insert, update, delete on public.labs to authenticated;

grant select on public.lab_problems to authenticated;
grant insert, update, delete on public.lab_problems to authenticated;
