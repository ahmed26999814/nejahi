-- Run public result views with the caller's RLS permissions and keep all
-- privileged RPCs behind the server-side service role.

do $$
declare
  v_name text;
  v_views text[] := array[
    'brevet_2026_ranked_results','concour_2026_ranked_results','bac_stats','brevet_top_students',
    'bac_region_stats','concours_center_stats','bac_school_stats','bac_session2_stats',
    'bac_ranked_results','brevet_ranked_results','concours_ranked_results','bac_session2_ranked_results',
    'excellence_1as_ranked_results','concours_locations_view','concours_school_stats','bac_top_students',
    'concours_stats','excellence_1as_stats','bac_session2_region_stats','concours_region_stats',
    'concours_results_view','concours_top_students','brevet_stats','excellence_1as_region_stats',
    'bac_session2_top_students','concours_moughataa_stats','bac_track_stats','brevet_region_stats',
    'excellence_1as_top_students','brevet_school_stats','bac_session2_track_stats','bepc_2022_test_ranked_results'
  ];
begin
  foreach v_name in array v_views loop
    if to_regclass(format('public.%I', v_name)) is not null then
      execute format('alter view public.%I set (security_invoker = true)', v_name);
    end if;
  end loop;
end;
$$;

alter function public.touch_published_exams_updated_at() set search_path = public;

revoke execute on function public.ensure_persisted_exam_rank(text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.ensure_persisted_exam_rank(text,text,text,text,text,text,text) to service_role;

revoke execute on function public.prepare_results_table_speed(text,text,text,text) from public, anon, authenticated;
grant execute on function public.prepare_results_table_speed(text,text,text,text) to service_role;
revoke execute on function public.prepare_results_table_speed(text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.prepare_results_table_speed(text,text,text,text,text,text,text) to service_role;

revoke execute on function public.refresh_published_exam_dashboard_cache(text) from public, anon, authenticated;
grant execute on function public.refresh_published_exam_dashboard_cache(text) to service_role;
revoke execute on function public.get_cached_published_exam_dashboard(text) from public, anon, authenticated;
grant execute on function public.get_cached_published_exam_dashboard(text) to service_role;

revoke execute on function public.search_uploaded_exam_rows(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.search_uploaded_exam_rows(text,text,text,text,text) to service_role;
revoke execute on function public.get_uploaded_exam_location_options(text,text,text,text) from public, anon, authenticated;
grant execute on function public.get_uploaded_exam_location_options(text,text,text,text) to service_role;
revoke execute on function public.get_concours_2026_location_options(text,text,text) from public, anon, authenticated;
grant execute on function public.get_concours_2026_location_options(text,text,text) to service_role;

revoke execute on function public.get_exam_filter_options(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.get_exam_filter_options(text,text,text,text,text) to service_role;
revoke execute on function public.find_exam_candidates_by_filters(text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.find_exam_candidates_by_filters(text,text,text,text,text,text) to service_role;

revoke execute on function public.create_results_upload_table(text,text[]) from public, anon, authenticated;
grant execute on function public.create_results_upload_table(text,text[]) to service_role;
revoke execute on function public.insert_results_upload_rows(text,jsonb,text[]) from public, anon, authenticated;
grant execute on function public.insert_results_upload_rows(text,jsonb,text[]) to service_role;
revoke execute on function public.reset_results_upload_table(text) from public, anon, authenticated;
grant execute on function public.reset_results_upload_table(text) to service_role;

revoke execute on function public.increment_apk_download(text) from public, anon, authenticated;
grant execute on function public.increment_apk_download(text) to service_role;
revoke execute on function public.register_site_visitor(text) from public, anon, authenticated;
grant execute on function public.register_site_visitor(text) to service_role;

notify pgrst, 'reload schema';
