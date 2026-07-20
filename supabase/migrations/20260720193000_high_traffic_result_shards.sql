-- CDN-friendly result shards for high-traffic result publication.
--
-- Simple exams are grouped by the last three normalized candidate-number digits.
-- This caps the number of hot CDN keys at 1,000 per source while keeping each
-- database response small. Concours-style uploads are grouped by examination
-- centre because candidate numbers are local to the centre.

create index if not exists result_number_lookup_number_shard_idx
  on public.result_number_lookup (
    source_key,
    (right(lpad(candidate_key, 3, '0'), 3)),
    candidate_key,
    rank
  );

create index if not exists result_number_lookup_centre_shard_idx
  on public.result_number_lookup (
    source_key,
    wilaya,
    moughataa,
    centre,
    candidate_key,
    rank
  );

create or replace function public.get_result_number_shard(
  p_source_key text,
  p_shard_key text
)
returns table (
  candidate_key text,
  rank bigint,
  payload jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    r.candidate_key,
    r.rank,
    r.payload
  from public.result_number_lookup r
  where p_source_key ~ '^(bac|brevet|bac_session|excellence_1as|upload:[A-Za-z_][A-Za-z0-9_]{1,62})$'
    and p_shard_key ~ '^[0-9]{3}$'
    and r.source_key = p_source_key
    and right(lpad(r.candidate_key, 3, '0'), 3) = p_shard_key
  order by r.candidate_key, r.rank asc nulls last
  limit 5000;
$$;

revoke execute on function public.get_result_number_shard(text, text)
  from public, anon, authenticated;
grant execute on function public.get_result_number_shard(text, text)
  to service_role;

create or replace function public.get_result_centre_shard(
  p_source_key text,
  p_wilaya text,
  p_moughataa text,
  p_centre text
)
returns table (
  candidate_key text,
  rank bigint,
  payload jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    r.candidate_key,
    r.rank,
    r.payload
  from public.result_number_lookup r
  where p_source_key ~ '^upload:[A-Za-z_][A-Za-z0-9_]{1,62}$'
    and length(p_wilaya) between 1 and 160
    and length(p_moughataa) between 1 and 160
    and length(p_centre) between 1 and 160
    and r.source_key = p_source_key
    and r.wilaya = p_wilaya
    and r.moughataa = p_moughataa
    and r.centre = p_centre
  order by r.candidate_key, r.rank asc nulls last
  limit 5000;
$$;

revoke execute on function public.get_result_centre_shard(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.get_result_centre_shard(text, text, text, text)
  to service_role;

analyze public.result_number_lookup;
