create sequence if not exists public.site_pageview_counter_seq
  as bigint
  increment by 1
  minvalue 1
  start with 1
  cache 1;

do $$
declare
  current_total bigint;
begin
  select last_value::bigint into current_total from public.site_pageview_counter_seq;
  perform setval(
    'public.site_pageview_counter_seq',
    greatest(coalesce(current_total, 0), 36807),
    true
  );
end
$$;

revoke all on sequence public.site_pageview_counter_seq from public, anon, authenticated;
grant usage, select on sequence public.site_pageview_counter_seq to service_role;

create or replace function public.register_site_pageview()
returns bigint
language sql
volatile
security invoker
set search_path = ''
as $$
  select nextval('public.site_pageview_counter_seq')::bigint;
$$;

revoke all on function public.register_site_pageview() from public, anon, authenticated;
grant execute on function public.register_site_pageview() to service_role;

create or replace function public.get_site_visit_count()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select last_value::bigint from public.site_pageview_counter_seq;
$$;

revoke all on function public.get_site_visit_count() from public, anon, authenticated;
grant execute on function public.get_site_visit_count() to service_role;

create or replace function public.register_site_visit(p_visitor_hash text, p_session_hash text)
returns bigint
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  total bigint;
  visit_rows integer := 0;
  inserted_rows integer := 0;
begin
  if coalesce(length(btrim(p_visitor_hash)),0)<32 or coalesce(length(btrim(p_session_hash)),0)<32 then
    raise exception 'Invalid visitor or session identifier';
  end if;

  insert into public.site_visitors(visitor_hash)
  values (p_visitor_hash)
  on conflict (visitor_hash) do update
    set last_seen_at=now(), visit_count=public.site_visitors.visit_count+1
    where public.site_visitors.last_seen_at < now()-interval '30 minutes';
  get diagnostics visit_rows=row_count;

  insert into public.site_visit_sessions(session_hash,visitor_hash)
  values (p_session_hash,p_visitor_hash)
  on conflict (session_hash) do nothing;
  get diagnostics inserted_rows=row_count;

  if inserted_rows>0 then
    perform nextval('public.site_visit_counter_seq');
  end if;

  if visit_rows>0 then
    update public.site_runtime_metrics
    set visit_count = visit_count + 1,
        updated_at = now()
    where id = 1;
  end if;

  select last_value::bigint into total from public.site_pageview_counter_seq;
  return coalesce(total,0);
end;
$function$;

revoke all on function public.register_site_visit(text, text) from public, anon, authenticated;
grant execute on function public.register_site_visit(text, text) to service_role;
