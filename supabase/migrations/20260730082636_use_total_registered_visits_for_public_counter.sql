alter table public.site_runtime_metrics
  add column if not exists visit_count bigint not null default 0;

update public.site_runtime_metrics
set visit_count = greatest(
  visit_count,
  coalesce((select sum(v.visit_count)::bigint from public.site_visitors v), 0::bigint)
),
updated_at = now()
where id = 1;

create or replace function public.get_site_visit_count()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (select visit_count::bigint from public.site_runtime_metrics where id = 1),
    0::bigint
  );
$$;

revoke execute on function public.get_site_visit_count()
  from public, anon, authenticated;
grant execute on function public.get_site_visit_count()
  to service_role;

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
    where id = 1
    returning visit_count into total;
  else
    select visit_count into total
    from public.site_runtime_metrics
    where id = 1;
  end if;

  return coalesce(total,0);
end;
$function$;

revoke all on function public.register_site_visit(text,text) from public, anon, authenticated;
grant execute on function public.register_site_visit(text,text) to service_role;
