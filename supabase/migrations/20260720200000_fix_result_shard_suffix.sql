-- PostgreSQL lpad(text, 3, '0') truncates values longer than three digits.
-- Use concatenation before right() so the shard always matches the final three
-- normalized candidate-number digits used by the browser.

drop index if exists public.result_number_lookup_number_shard_idx;

create index result_number_lookup_number_shard_idx
  on public.result_number_lookup (
    source_key,
    (right('000' || candidate_key, 3)),
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
    and right('000' || r.candidate_key, 3) = p_shard_key
  order by r.candidate_key, r.rank asc nulls last
  limit 5000;
$$;

revoke execute on function public.get_result_number_shard(text, text)
  from public, anon, authenticated;
grant execute on function public.get_result_number_shard(text, text)
  to service_role;

analyze public.result_number_lookup;
