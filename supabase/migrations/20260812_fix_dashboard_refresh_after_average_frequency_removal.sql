create or replace function public.refresh_published_exam_dashboard_cache(p_source_key text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
set statement_timeout to '180s'
set lock_timeout to '5s'
as $function$
declare
  result jsonb;
begin
  result := public.get_published_exam_dashboard(p_source_key, true);

  insert into public.published_exam_dashboard_cache(source_key, payload, refreshed_at)
  values (p_source_key, result, now())
  on conflict (source_key)
  do update set payload = excluded.payload, refreshed_at = excluded.refreshed_at;

  return result;
end;
$function$;
