create or replace function public.list_result_centre_shards(p_source_key text)
returns table(wilaya text, moughataa text, centre text)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    r.wilaya,
    r.moughataa,
    r.centre
  from public.result_number_lookup r
  where p_source_key ~ '^upload:[A-Za-z_][A-Za-z0-9_]{1,62}$'
    and r.source_key = p_source_key
    and r.wilaya <> ''
    and r.moughataa <> ''
    and r.centre <> ''
  group by r.wilaya, r.moughataa, r.centre
  order by r.wilaya, r.moughataa, r.centre
  limit 10000;
$$;

revoke all on function public.list_result_centre_shards(text) from public, anon, authenticated;
grant execute on function public.list_result_centre_shards(text) to service_role;
