-- Read-only visitor total used by the CDN-cached public counter endpoint.
-- New visit registration remains private to the service role.

create or replace function public.get_site_visit_count()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select last_value::bigint from public.site_visit_counter_seq), 0::bigint);
$$;

revoke execute on function public.get_site_visit_count()
  from public, anon, authenticated;
grant execute on function public.get_site_visit_count()
  to service_role;
