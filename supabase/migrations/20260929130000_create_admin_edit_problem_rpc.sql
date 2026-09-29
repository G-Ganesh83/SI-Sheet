-- ==============================================================================
-- SI Sheet - Migration: Transactional Admin Catalog Problem Edit RPC
-- File: 20260929130000_create_admin_edit_problem_rpc.sql
--
-- Atomically updates a problem's title, url, platform, topics, and lab dates.
-- Preserves the existing problem UUID and all user_progress references.
-- Fully transactional: any failure causes a complete rollback.
-- ==============================================================================

create or replace function public.admin_edit_problem(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_problem_id_input text;
  v_original_url text;
  v_problem_id uuid;
  v_title text;
  v_url text;
  v_platform text;
  v_topic_elem text;
  v_topic_name text;
  v_topic_slug text;
  v_topic_id uuid;
  v_topic_ids uuid[] := array[]::uuid[];
  v_topics_out text[] := array[]::text[];
  v_lab_elem text;
  v_lab_raw text;
  v_lab_date date;
  v_lab_title text;
  v_lab_id uuid;
  v_lab_ids uuid[] := array[]::uuid[];
  v_lab_dates_out text[] := array[]::text[];
begin
  -- 1. Authorization check: must be admin or service_role
  if not (
    private.is_admin()
    or current_user in ('service_role', 'postgres', 'supabase_admin')
    or session_user in ('service_role', 'postgres', 'supabase_admin')
  ) then
    raise exception 'Unauthorized: Admin privileges required to edit catalog problems.';
  end if;

  -- 2. Extract inputs
  v_problem_id_input := trim(payload->>'problemId');
  v_original_url := trim(payload->>'originalUrl');
  v_title := trim(payload->>'title');
  v_url := trim(payload->>'url');
  v_platform := trim(payload->>'platform');

  -- 3. Validate required fields
  if v_title is null or v_title = '' then
    raise exception 'Problem title cannot be empty.';
  end if;

  if v_url is null or v_url = '' then
    raise exception 'Problem URL cannot be empty.';
  end if;

  if not (v_url ~* '^https?://[^\s]+$') then
    raise exception 'Please enter a valid HTTP/HTTPS URL.';
  end if;

  if v_platform is null or v_platform = '' then
    raise exception 'Platform is required.';
  end if;

  if not (payload ? 'labDates') or jsonb_typeof(payload->'labDates') <> 'array' or jsonb_array_length(payload->'labDates') = 0 then
    raise exception 'At least one lab date assignment is required.';
  end if;

  -- 4. Locate the existing problem to preserve its UUID
  -- First try direct UUID lookup
  if v_problem_id_input is not null and v_problem_id_input ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select id into v_problem_id
    from public.problems
    where id = v_problem_id_input::uuid;
  end if;

  -- Fallback to original URL lookup
  if v_problem_id is null and v_original_url is not null and v_original_url <> '' then
    select id into v_problem_id
    from public.problems
    where lower(trim(url)) = lower(v_original_url)
    limit 1;
  end if;

  -- Fallback to current URL lookup
  if v_problem_id is null then
    select id into v_problem_id
    from public.problems
    where lower(trim(url)) = lower(v_url)
    limit 1;
  end if;

  if v_problem_id is null then
    raise exception 'Problem not found in catalog.';
  end if;

  -- 5. URL Conflict check: ensure new URL is not already used by another problem
  if exists (
    select 1
    from public.problems
    where lower(trim(url)) = lower(v_url)
      and id <> v_problem_id
  ) then
    raise exception 'URL conflict: Another problem with URL "%" already exists in the catalog.', v_url;
  end if;

  -- 6. Update the problem record in-place (UUID is strictly preserved)
  update public.problems
  set title = v_title,
      url = v_url,
      platform = v_platform,
      updated_at = now()
  where id = v_problem_id;

  -- 7. Reconcile Topics
  if (payload ? 'topics') and jsonb_typeof(payload->'topics') = 'array' then
    for v_topic_elem in select * from jsonb_array_elements_text(payload->'topics')
    loop
      v_topic_name := trim(v_topic_elem);
      if v_topic_name <> '' then
        v_topic_slug := private.slugify(v_topic_name);
        if v_topic_slug <> '' then
          select id into v_topic_id
          from public.topics
          where slug = v_topic_slug or lower(name) = lower(v_topic_name)
          limit 1;

          if v_topic_id is null then
            insert into public.topics (name, slug)
            values (v_topic_name, v_topic_slug)
            on conflict (slug) do update set name = excluded.name
            returning id into v_topic_id;
          end if;

          v_topic_ids := array_append(v_topic_ids, v_topic_id);
          v_topics_out := array_append(v_topics_out, v_topic_name);

          insert into public.problem_topics (problem_id, topic_id)
          values (v_problem_id, v_topic_id)
          on conflict (problem_id, topic_id) do nothing;
        end if;
      end if;
    end loop;
  end if;

  -- Remove unselected topics for this problem
  delete from public.problem_topics
  where problem_id = v_problem_id
    and not (topic_id = any(v_topic_ids));

  -- 8. Reconcile Lab Assignments
  for v_lab_elem in select * from jsonb_array_elements_text(payload->'labDates')
  loop
    v_lab_raw := trim(v_lab_elem);
    if v_lab_raw <> '' then
      v_lab_date := private.parse_lab_date(v_lab_raw);
      if v_lab_date is null then
        raise exception 'Invalid lab date format: "%".', v_lab_raw;
      end if;

      v_lab_title := 'Lab: ' || private.format_lab_date(v_lab_date);

      select id into v_lab_id
      from public.labs
      where lab_date = v_lab_date
      limit 1;

      if v_lab_id is null then
        insert into public.labs (lab_date, title)
        values (v_lab_date, v_lab_title)
        on conflict (lab_date) do update set title = coalesce(excluded.title, labs.title)
        returning id into v_lab_id;
      end if;

      v_lab_ids := array_append(v_lab_ids, v_lab_id);
      v_lab_dates_out := array_append(v_lab_dates_out, private.format_lab_date(v_lab_date));

      insert into public.lab_problems (lab_id, problem_id)
      values (v_lab_id, v_problem_id)
      on conflict (lab_id, problem_id) do nothing;
    end if;
  end loop;

  -- Remove unselected lab assignments for this problem
  delete from public.lab_problems
  where problem_id = v_problem_id
    and not (lab_id = any(v_lab_ids));

  -- 9. Return updated problem representation
  return jsonb_build_object(
    'ok', true,
    'problem', jsonb_build_object(
      'id', v_problem_id,
      'title', v_title,
      'url', v_url,
      'platform', v_platform,
      'topics', v_topics_out,
      'labDates', v_lab_dates_out
    )
  );
end;
$$;

-- Restrict execution
revoke all on function public.admin_edit_problem(jsonb) from public;
revoke all on function public.admin_edit_problem(jsonb) from anon;
grant execute on function public.admin_edit_problem(jsonb) to authenticated;
grant execute on function public.admin_edit_problem(jsonb) to service_role;
