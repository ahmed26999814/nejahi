create sequence if not exists public.site_visit_counter_seq as bigint;

do $$
declare
  existing_total bigint;
begin
  select count(*) into existing_total from public.site_visit_sessions;
  perform setval('public.site_visit_counter_seq', greatest(existing_total, 1), existing_total > 0);
end
$$;

create table if not exists public.site_runtime_metrics (
  id smallint primary key default 1 check (id = 1),
  online_count bigint not null default 0,
  online_counted_at timestamptz not null default to_timestamp(0),
  cleanup_at timestamptz not null default to_timestamp(0),
  updated_at timestamptz not null default now()
);

insert into public.site_runtime_metrics (id)
values (1)
on conflict (id) do nothing;

alter table public.site_runtime_metrics enable row level security;
revoke all on public.site_runtime_metrics from anon, authenticated;
revoke all on sequence public.site_visit_counter_seq from anon, authenticated;

create or replace function public.register_site_visit(p_visitor_hash text, p_session_hash text)
returns bigint
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  total bigint;
  inserted_rows integer := 0;
begin
  if coalesce(length(btrim(p_visitor_hash)), 0) < 32
     or coalesce(length(btrim(p_session_hash)), 0) < 32 then
    raise exception 'Invalid visitor or session identifier';
  end if;

  insert into public.site_visitors(visitor_hash)
  values (p_visitor_hash)
  on conflict (visitor_hash) do update
    set last_seen_at = now(),
        visit_count = public.site_visitors.visit_count + 1;

  insert into public.site_visit_sessions(session_hash, visitor_hash)
  values (p_session_hash, p_visitor_hash)
  on conflict (session_hash) do nothing;

  get diagnostics inserted_rows = row_count;

  if inserted_rows > 0 then
    select nextval('public.site_visit_counter_seq') into total;
  else
    select last_value into total from public.site_visit_counter_seq;
  end if;

  return coalesce(total, 0);
end;
$function$;

create or replace function public.touch_site_active_session(p_session_hash text)
returns bigint
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  active_total bigint;
  cleanup_claimed smallint;
begin
  if coalesce(length(btrim(p_session_hash)), 0) < 32 then
    raise exception 'Invalid session identifier';
  end if;

  insert into public.site_active_sessions(session_hash, last_seen_at)
  values (p_session_hash, now())
  on conflict (session_hash) do update
    set last_seen_at = excluded.last_seen_at;

  update public.site_runtime_metrics
  set cleanup_at = now(), updated_at = now()
  where id = 1
    and cleanup_at < now() - interval '10 minutes'
  returning id into cleanup_claimed;

  if cleanup_claimed is not null then
    delete from public.site_active_sessions
    where last_seen_at < now() - interval '1 hour';
  end if;

  update public.site_runtime_metrics
  set online_count = (
        select count(*)
        from public.site_active_sessions
        where last_seen_at >= now() - interval '5 minutes'
      ),
      online_counted_at = now(),
      updated_at = now()
  where id = 1
    and online_counted_at < now() - interval '15 seconds'
  returning online_count into active_total;

  if active_total is null then
    select online_count into active_total
    from public.site_runtime_metrics
    where id = 1;
  end if;

  return coalesce(active_total, 0);
end;
$function$;

revoke all on function public.register_site_visit(text, text) from public, anon, authenticated;
revoke all on function public.touch_site_active_session(text) from public, anon, authenticated;
grant execute on function public.register_site_visit(text, text) to service_role;
grant execute on function public.touch_site_active_session(text) to service_role;
