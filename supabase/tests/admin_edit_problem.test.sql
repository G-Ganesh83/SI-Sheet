-- ==============================================================================
-- SI Sheet - Test Suite: admin_edit_problem Atomicity, Reconciliation & UUID Safety
-- File: supabase/tests/admin_edit_problem.test.sql
-- ==============================================================================

do $$
declare
  v_test_prob_id uuid;
  v_test_url text := 'https://example.com/problems/test-edit-target-1';
  v_conflict_url text := 'https://example.com/problems/test-edit-conflict-2';
  v_test_topic_a text := 'TestTopicAlpha';
  v_test_topic_b text := 'TestTopicBeta';
  v_test_topic_c text := 'TestTopicGamma';
  v_count integer;
  v_result jsonb;
  v_error_occurred boolean := false;
  v_error_message text := '';
  v_problem_after record;
begin
  raise notice '==================================================';
  raise notice 'STARTING ADMIN EDIT PROBLEM TESTS';
  raise notice '==================================================';

  -- 1. Setup clean test records
  delete from public.problems where url in (v_test_url, v_conflict_url);
  delete from public.topics where name in (v_test_topic_a, v_test_topic_b, v_test_topic_c);

  -- Insert target problem
  insert into public.problems (title, url, platform)
  values ('Original Title', v_test_url, 'LeetCode')
  returning id into v_test_prob_id;

  -- Insert conflicting problem for conflict testing
  insert into public.problems (title, url, platform)
  values ('Conflict Problem', v_conflict_url, 'LeetCode');

  -- 2. TEST A: Successful Edit (Title, Topics, Labs, UUID Preservation)
  v_result := public.admin_edit_problem(
    jsonb_build_object(
      'problemId', v_test_prob_id,
      'title', 'Updated Title By Admin',
      'url', v_test_url,
      'platform', 'Smart Interviews',
      'topics', jsonb_build_array(v_test_topic_a, v_test_topic_b),
      'labDates', jsonb_build_array('21 Sep 2026', '04 Aug 2026')
    )
  );

  raise notice 'Edit result: %', v_result;

  -- Verify UUID is preserved
  select * into v_problem_after from public.problems where id = v_test_prob_id;
  if v_problem_after.title <> 'Updated Title By Admin' then
    raise exception 'TEST A FAILED: Title was not updated! Got: %', v_problem_after.title;
  end if;
  if v_problem_after.platform <> 'Smart Interviews' then
    raise exception 'TEST A FAILED: Platform was not updated! Got: %', v_problem_after.platform;
  end if;

  -- Verify topics are linked (should have 2 topics)
  select count(*) into v_count from public.problem_topics where problem_id = v_test_prob_id;
  if v_count <> 2 then
    raise exception 'TEST A FAILED: Expected 2 problem_topics, found %', v_count;
  end if;

  -- Verify lab assignments (should have 2 labs)
  select count(*) into v_count from public.lab_problems where problem_id = v_test_prob_id;
  if v_count <> 2 then
    raise exception 'TEST A FAILED: Expected 2 lab_problems, found %', v_count;
  end if;

  raise notice 'SUCCESS: Test A (Edit + UUID Preservation) passed!';

  -- 3. TEST B: Topic & Lab Reconciliation (Remove Topic A, Add Topic C, Remove 1 Lab)
  v_result := public.admin_edit_problem(
    jsonb_build_object(
      'problemId', v_test_prob_id,
      'title', 'Updated Title By Admin',
      'url', v_test_url,
      'platform', 'Smart Interviews',
      'topics', jsonb_build_array(v_test_topic_b, v_test_topic_c), -- A removed, C added
      'labDates', jsonb_build_array('21 Sep 2026') -- 04 Aug removed
    )
  );

  -- Check Topic A is removed and C is added
  select count(*) into v_count from public.problem_topics pt
  join public.topics t on t.id = pt.topic_id
  where pt.problem_id = v_test_prob_id and t.name = v_test_topic_a;
  if v_count <> 0 then
    raise exception 'TEST B FAILED: Topic A was not removed from problem_topics!';
  end if;

  select count(*) into v_count from public.problem_topics pt
  join public.topics t on t.id = pt.topic_id
  where pt.problem_id = v_test_prob_id and t.name = v_test_topic_c;
  if v_count <> 1 then
    raise exception 'TEST B FAILED: Topic C was not added to problem_topics!';
  end if;

  -- Check Lab count is 1
  select count(*) into v_count from public.lab_problems where problem_id = v_test_prob_id;
  if v_count <> 1 then
    raise exception 'TEST B FAILED: Expected 1 lab assignment, found %', v_count;
  end if;

  raise notice 'SUCCESS: Test B (Topic & Lab reconciliation) passed!';

  -- 4. TEST C: Duplicate URL Conflict Rejection & Rollback
  v_error_occurred := false;
  begin
    perform public.admin_edit_problem(
      jsonb_build_object(
        'problemId', v_test_prob_id,
        'title', 'Should Fail',
        'url', v_conflict_url, -- Conflicting with existing problem!
        'platform', 'LeetCode',
        'topics', jsonb_build_array(v_test_topic_b),
        'labDates', jsonb_build_array('21 Sep 2026')
      )
    );
  exception when others then
    v_error_occurred := true;
    v_error_message := SQLERRM;
    raise notice 'Caught expected URL conflict exception: %', v_error_message;
  end;

  if not v_error_occurred then
    raise exception 'TEST C FAILED: Expected URL conflict exception, but none was raised!';
  end if;

  -- Verify original problem was NOT modified by failed attempt
  select * into v_problem_after from public.problems where id = v_test_prob_id;
  if v_problem_after.url <> v_test_url then
    raise exception 'TEST C FAILED: Target problem URL was changed despite conflict!';
  end if;

  raise notice 'SUCCESS: Test C (Duplicate URL conflict & rollback) passed!';

  -- 5. Cleanup
  delete from public.problems where url in (v_test_url, v_conflict_url);
  delete from public.topics where name in (v_test_topic_a, v_test_topic_b, v_test_topic_c);

  raise notice '==================================================';
  raise notice 'ALL ADMIN EDIT TESTS COMPLETED SUCCESSFULLY!';
  raise notice '==================================================';
end;
$$;
