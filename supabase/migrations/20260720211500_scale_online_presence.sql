-- Keep the public "online now" indicator inexpensive during result-day spikes.
-- Reads are served through a CDN-cached API while presence writes are sparse.

create or replace function public.get_site_online_count()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (select online_count::bigint from public.site_runtime_metrics where id = 1),
    0::bigint
  );
$$;

revoke execute on function public.get_site_online_count()
  from public, anon, authenticated;
grant execute on function public.get_site_online_count()
  to service_role;

-- The client now sends a presence heartbeat roughly every eight minutes.
-- A ten-minute activity window preserves a useful approximation while reducing
-- database writes by more than an order of magnitude versus 30-second polling.
create or replace function public.touch_site_active_session(p_session_hash text)
returns bigint
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  active_total bigint;
  got_lock boolean;
begin
  if coalesce(length(btrim(p_session_hash)), 0) < 32 then
    raise exception 'Invalid session identifier';
  end if;

  insert into public.site_active_sessions(session_hash, last_seen_at)
  values (p_session_hash, now())
  on conflict (session_hash) do update
    set last_seen_at = excluded.last_seen_at
    where public.site_active_sessions.last_seen_at < now() - interval '2 minutes';

  select online_count
    into active_total
    from public.site_runtime_metrics
    where id = 1;

  if exists (
    select 1
    from public.site_runtime_metrics
    where id = 1
      and online_counted_at >= now() - interval '30 seconds'
  ) then
    return coalesce(active_total, 0);
  end if;

  got_lock := pg_try_advisory_xact_lock(hashtext('mauriresults-online-count'));
  if not got_lock then
    return coalesce(active_total, 0);
  end if;

  delete from public.site_active_sessions
  where last_seen_at < now() - interval '1 hour';

  select count(*)
    into active_total
    from public.site_active_sessions
    where last_seen_at >= now() - interval '10 minutes';

  update public.site_runtime_metrics
  set online_count = active_total,
      online_counted_at = now(),
      cleanup_at = now(),
      updated_at = now()
  where id = 1;

  return coalesce(active_total, 0);
end;
$function$;

revoke execute on function public.touch_site_active_session(text)
  from public, anon, authenticated;
grant execute on function public.touch_site_active_session(text)
  to service_role;
