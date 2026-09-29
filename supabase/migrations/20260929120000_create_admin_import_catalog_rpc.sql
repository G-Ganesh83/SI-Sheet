-- ==============================================================================
-- SI Sheet - Migration: Transactional Admin Catalog Import RPC
-- File: 20260929120000_create_admin_import_catalog_rpc.sql
--
-- Provides an all-or-nothing PostgreSQL stored procedure for importing problems,
-- topics, problem_topics, labs, and lab_problems into the shared catalog.
-- Runs inside a single transaction: any failure causes a complete rollback.
-- ==============================================================================

-- Helper 1: Locale-independent lab date parser ("21 Sep 2026" or "YYYY-MM-DD" -> date)
create or replace function private.parse_lab_date(p_date_str text)
returns date
language plpgsql
immutable
as $$
declare
  v_trimmed text := trim(p_date_str);
  v_match text[];
  v_day text;
  v_mon text;
  v_year text;
  v_month_num text;
begin
  if v_trimmed is null or v_trimmed = '' then
    return null;
  end if;

  -- 1. ISO format: YYYY-MM-DD
  if v_trimmed ~ '^\d{4}-\d{2}-\d{2}$' then
    return v_trimmed::date;
  end if;

  -- 2. Human format: DD Mon YYYY (e.g. "21 Sep 2026" or "3 Aug 2026")
  v_match := regexp_match(v_trimmed, '^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$');
  if v_match is not null then
    v_day := lpad(v_match[1], 2, '0');
    v_mon := lower(substring(v_match[2] from 1 for 3));
    v_year := v_match[3];

    case v_mon
      when 'jan' then v_month_num := '01';
      when 'feb' then v_month_num := '02';
      when 'mar' then v_month_num := '03';
      when 'apr' then v_month_num := '04';
      when 'may' then v_month_num := '05';
      when 'jun' then v_month_num := '06';
      when 'jul' then v_month_num := '07';
      when 'aug' then v_month_num := '08';
      when 'sep' then v_month_num := '09';
      when 'oct' then v_month_num := '10';
      when 'nov' then v_month_num := '11';
      when 'dec' then v_month_num := '12';
      else
        raise exception 'Unknown month name "%" in lab date "%"', v_match[2], p_date_str;
    end case;

    return (v_year || '-' || v_month_num || '-' || v_day)::date;
  end if;

  -- 3. Fallback
  return v_trimmed::date;
exception when others then
  raise exception 'Invalid lab date format: "%". Expected "DD Mon YYYY" (e.g. "21 Sep 2026") or "YYYY-MM-DD".', p_date_str;
end;
$$;

-- Helper 2: Format date to human lab date string (e.g. date '2026-09-21' -> "21 Sep 2026")
create or replace function private.format_lab_date(p_date date)
returns text
language plpgsql
immutable
as $$
declare
  v_day text := to_char(p_date, 'DD');
  v_mon text;
  v_year text := to_char(p_date, 'YYYY');
begin
  case extract(month from p_date)::integer
    when 1 then v_mon := 'Jan';
    when 2 then v_mon := 'Feb';
    when 3 then v_mon := 'Mar';
    when 4 then v_mon := 'Apr';
    when 5 then v_mon := 'May';
    when 6 then v_mon := 'Jun';
    when 7 then v_mon := 'Jul';
    when 8 then v_mon := 'Aug';
    when 9 then v_mon := 'Sep';
    when 10 then v_mon := 'Oct';
    when 11 then v_mon := 'Nov';
    when 12 then v_mon := 'Dec';
  end case;
  return v_day || ' ' || v_mon || ' ' || v_year;
end;
$$;

-- Helper 3: Convert text to clean URL-safe slug
create or replace function private.slugify(p_text text)
returns text
language sql
immutable
as $$
  select trim(both '-' from lower(regexp_replace(regexp_replace(trim(p_text), '&', 'and', 'g'), '[^a-z0-9]+', '-', 'g')));
$$;

-- ==============================================================================
-- Main Transactional Import Function
-- ==============================================================================
create or replace function public.admin_import_catalog(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidates jsonb;
  v_candidate jsonb;
  v_action text;
  v_title text;
  v_url text;
  v_platform text;
  v_lookup_url text;
  v_problem_id uuid;
  v_topic_elem text;
  v_topic_name text;
  v_topic_slug text;
  v_topic_id uuid;
  v_lab_elem text;
  v_lab_raw text;
  v_lab_date date;
  v_lab_title text;
  v_lab_id uuid;
  v_added integer := 0;
  v_updated integer := 0;
  v_processed integer := 0;
begin
  -- 1. Authorization check: must be admin or service_role
  if not (
    private.is_admin()
    or current_user in ('service_role', 'postgres', 'supabase_admin')
    or session_user in ('service_role', 'postgres', 'supabase_admin')
  ) then
    raise exception 'Unauthorized: Admin privileges required to import catalog items';
  end if;

  -- 2. Validate payload structure
  if jsonb_typeof(payload) = 'array' then
    v_candidates := payload;
  elsif jsonb_typeof(payload->'candidates') = 'array' then
    v_candidates := payload->'candidates';
  else
    raise exception 'Invalid payload: expected an array or an object with a "candidates" array.';
  end if;

  if jsonb_array_length(v_candidates) = 0 then
    raise exception 'Payload contains no candidates to import.';
  end if;

  -- 3. Process every candidate. Any error raises an unhandled exception,
  --    which automatically aborts and rolls back the entire transaction.
  for v_candidate in select * from jsonb_array_elements(v_candidates)
  loop
    v_action := trim(v_candidate->>'action');
    v_title := trim(v_candidate->>'title');
    v_url := trim(v_candidate->>'url');
    v_platform := trim(v_candidate->>'platform');
    v_lookup_url := coalesce(trim(v_candidate->>'existingProblemUrl'), v_url);

    if v_action not in ('new', 'add-lab-date') then
      raise exception 'Candidate "%" has invalid action "%". Only "new" and "add-lab-date" are allowed.',
        coalesce(v_title, v_url, 'unknown'), coalesce(v_action, 'null');
    end if;

    if v_action = 'new' then
      -- Validate required fields
      if v_url is null or v_url = '' then
        raise exception 'Import failed: A problem URL is required for "%".', coalesce(v_title, 'unknown');
      end if;
      if v_title is null or v_title = '' then
        raise exception 'Import failed: A problem title is required for "%".', v_url;
      end if;
      if v_platform is null or v_platform = '' then
        raise exception 'Import failed: A platform is required for problem "%".', v_title;
      end if;
      if not (v_candidate ? 'labDates') or jsonb_typeof(v_candidate->'labDates') <> 'array' or jsonb_array_length(v_candidate->'labDates') = 0 then
        raise exception 'Import failed: At least one lab date is required for problem "%".', v_title;
      end if;

      -- Check if problem already exists by URL
      select id into v_problem_id
      from public.problems
      where lower(trim(url)) = lower(v_url)
      limit 1;

      if v_problem_id is not null then
        -- Update existing problem title and platform
        update public.problems
        set title = v_title,
            platform = v_platform,
            updated_at = now()
        where id = v_problem_id;
        v_updated := v_updated + 1;
      else
        -- Insert new problem
        insert into public.problems (title, url, platform)
        values (v_title, v_url, v_platform)
        returning id into v_problem_id;
        v_added := v_added + 1;
      end if;

      -- Upsert topics & link
      if (v_candidate ? 'topics') and jsonb_typeof(v_candidate->'topics') = 'array' then
        for v_topic_elem in select * from jsonb_array_elements_text(v_candidate->'topics')
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

              insert into public.problem_topics (problem_id, topic_id)
              values (v_problem_id, v_topic_id)
              on conflict (problem_id, topic_id) do nothing;
            end if;
          end if;
        end loop;
      end if;

      -- Upsert lab dates & link
      for v_lab_elem in select * from jsonb_array_elements_text(v_candidate->'labDates')
      loop
        v_lab_raw := trim(v_lab_elem);
        if v_lab_raw <> '' then
          v_lab_date := private.parse_lab_date(v_lab_raw);
          if v_lab_date is null then
            raise exception 'Import failed: Invalid lab date "%" for candidate "%".', v_lab_raw, v_title;
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

          insert into public.lab_problems (lab_id, problem_id)
          values (v_lab_id, v_problem_id)
          on conflict (lab_id, problem_id) do nothing;
        end if;
      end loop;

    elsif v_action = 'add-lab-date' then
      -- Must find existing problem
      if v_lookup_url is null or v_lookup_url = '' then
        raise exception 'Import failed: Cannot add lab date because problem URL is missing.';
      end if;

      select id into v_problem_id
      from public.problems
      where lower(trim(url)) = lower(v_lookup_url)
      limit 1;

      if v_problem_id is null then
        raise exception 'Import failed: Cannot add lab date because problem with URL "%" does not exist in catalog.', v_lookup_url;
      end if;

      if not (v_candidate ? 'labDates') or jsonb_typeof(v_candidate->'labDates') <> 'array' or jsonb_array_length(v_candidate->'labDates') = 0 then
        raise exception 'Import failed: At least one lab date is required for problem "%".', coalesce(v_title, v_lookup_url);
      end if;

      -- Link lab dates
      for v_lab_elem in select * from jsonb_array_elements_text(v_candidate->'labDates')
      loop
        v_lab_raw := trim(v_lab_elem);
        if v_lab_raw <> '' then
          v_lab_date := private.parse_lab_date(v_lab_raw);
          if v_lab_date is null then
            raise exception 'Import failed: Invalid lab date "%" for candidate "%".', v_lab_raw, coalesce(v_title, v_lookup_url);
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

          insert into public.lab_problems (lab_id, problem_id)
          values (v_lab_id, v_problem_id)
          on conflict (lab_id, problem_id) do nothing;
        end if;
      end loop;

      v_updated := v_updated + 1;
    end if;

    v_processed := v_processed + 1;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'added', v_added,
    'updated', v_updated,
    'processed', v_processed
  );
end;
$$;

-- Revoke public/anon execute, allow authenticated and service_role
revoke all on function public.admin_import_catalog(jsonb) from public;
revoke all on function public.admin_import_catalog(jsonb) from anon;
grant execute on function public.admin_import_catalog(jsonb) to authenticated;
grant execute on function public.admin_import_catalog(jsonb) to service_role;
