-- ==============================================================================
-- SI Sheet - Test Suite: admin_import_catalog Atomicity & Rollback
-- File: supabase/tests/admin_import_atomic.test.sql
-- ==============================================================================

do $$
declare
  v_test_topic text := 'TestAtomicTopic999';
  v_test_url_1 text := 'https://example.com/problems/atomic-rollback-test-1';
  v_test_url_2 text := 'https://example.com/problems/atomic-rollback-test-2';
  v_count_problems integer;
  v_count_topics integer;
  v_count_problem_topics integer;
  v_count_labs integer;
  v_count_lab_problems integer;
  v_error_occurred boolean := false;
  v_error_message text := '';
  v_result jsonb;
begin
  raise notice '==================================================';
  raise notice 'RUNNING TEST 1: All-or-Nothing Rollback Verification';
  raise notice '==================================================';

  -- Clean up any leftover test data
  delete from public.problems where url in (v_test_url_1, v_test_url_2);
  delete from public.topics where name = v_test_topic;

  -- Scenario A: Batch with 1 valid candidate and 1 failing candidate
  -- Candidate 1 is valid. Candidate 2 has an invalid lab date that triggers an exception.
  begin
    perform public.admin_import_catalog(
      jsonb_build_object(
        'candidates', jsonb_build_array(
          jsonb_build_object(
            'action', 'new',
            'title', 'Atomic Candidate 1',
            'url', v_test_url_1,
            'platform', 'LeetCode',
            'topics', jsonb_build_array(v_test_topic),
            'labDates', jsonb_build_array('21 Sep 2026')
          ),
          jsonb_build_object(
            'action', 'new',
            'title', 'Atomic Candidate 2 (Forced Failure)',
            'url', v_test_url_2,
            'platform', 'LeetCode',
            'topics', jsonb_build_array(v_test_topic),
            'labDates', jsonb_build_array('invalid-not-a-real-date') -- Force failure
          )
        )
      )
    );
  exception when others then
    v_error_occurred := true;
    v_error_message := SQLERRM;
    raise notice 'Caught expected exception: %', v_error_message;
  end;

  if not v_error_occurred then
    raise exception 'TEST 1 FAILED: Expected an exception due to invalid candidate date, but none occurred!';
  end if;

  -- VERIFY ROLLBACK: Candidate 1 must NOT exist in the database!
  select count(*) into v_count_problems from public.problems where url in (v_test_url_1, v_test_url_2);
  select count(*) into v_count_topics from public.topics where name = v_test_topic;

  if v_count_problems <> 0 then
    raise exception 'TEST 1 FAILED: Candidate 1 was found in problems table! Rollback failed. Count = %', v_count_problems;
  end if;

  if v_count_topics <> 0 then
    raise exception 'TEST 1 FAILED: Topic was found in topics table! Rollback failed. Count = %', v_count_topics;
  end if;

  raise notice 'SUCCESS: Rollback verified! No problems or topics remained after error.';

  raise notice '==================================================';
  raise notice 'RUNNING TEST 2: Successful Multi-Mutation Commit';
  raise notice '==================================================';

  -- Scenario B: Valid batch with 2 new candidates and topics
  v_result := public.admin_import_catalog(
    jsonb_build_object(
      'candidates', jsonb_build_array(
        jsonb_build_object(
          'action', 'new',
          'title', 'Atomic Candidate 1',
          'url', v_test_url_1,
          'platform', 'LeetCode',
          'topics', jsonb_build_array(v_test_topic),
          'labDates', jsonb_build_array('21 Sep 2026')
        ),
        jsonb_build_object(
          'action', 'new',
          'title', 'Atomic Candidate 2',
          'url', v_test_url_2,
          'platform', 'LeetCode',
          'topics', jsonb_build_array(v_test_topic),
          'labDates', jsonb_build_array('21 Sep 2026')
        )
      )
    )
  );

  raise notice 'RPC result: %', v_result;

  -- Verify both problems exist
  select count(*) into v_count_problems from public.problems where url in (v_test_url_1, v_test_url_2);
  select count(*) into v_count_topics from public.topics where name = v_test_topic;

  if v_count_problems <> 2 then
    raise exception 'TEST 2 FAILED: Expected 2 problems, found %', v_count_problems;
  end if;

  if v_count_topics <> 1 then
    raise exception 'TEST 2 FAILED: Expected 1 topic, found %', v_count_topics;
  end if;

  raise notice 'SUCCESS: Successful batch committed all records!';

  -- Cleanup test data
  delete from public.problems where url in (v_test_url_1, v_test_url_2);
  delete from public.topics where name = v_test_topic;

  raise notice '==================================================';
  raise notice 'ALL ATOMICITY TESTS PASSED SUCCESSFULLY!';
  raise notice '==================================================';
end;
$$;
