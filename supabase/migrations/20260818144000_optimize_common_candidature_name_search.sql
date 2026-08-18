-- Avoid expensive trigram similarity scoring across thousands of common-name
-- matches. Keep the trigram index for substring filtering, then rank cheaply by
-- exact/prefix/position/length. This cuts common-name lookups substantially.

create or replace function public.search_public_competition_candidatures(
  p_competition_slug text,
  p_query text,
  p_mode text default 'name',
  p_track_code text default null,
  p_limit integer default 20
)
returns table (
  candidate_id bigint,
  receipt_number text,
  name_ar text,
  name_fr text,
  track_code text,
  track_name_ar text,
  status text,
  rejection_reason text,
  source_file text
)
language plpgsql
stable
security definer
set search_path = public, extensions
set statement_timeout = '3s'
as $$
declare
  v_competition_id bigint;
  v_query text := btrim(coalesce(p_query, ''));
  v_normalized_query text;
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 25);
begin
  select c.id into v_competition_id
  from public.competitions c
  where c.slug = btrim(coalesce(p_competition_slug, ''))
    and c.is_published = true
  limit 1;

  if v_competition_id is null then
    return;
  end if;

  if p_mode = 'receipt' then
    v_query := regexp_replace(v_query, '\s+', '', 'g');
    if v_query = '' or length(v_query) > 40 then
      return;
    end if;

    return query
      select r.id, r.receipt_number, r.name_ar, r.name_fr, t.code, t.name_ar,
             r.status, r.rejection_reason, r.source_file
      from public.competition_candidatures r
      join public.competition_tracks t on t.id = r.track_id
      where r.competition_id = v_competition_id
        and r.receipt_number = v_query
        and (coalesce(btrim(p_track_code), '') = '' or t.code = btrim(p_track_code))
      order by t.sort_order, r.id
      limit v_limit;
    return;
  end if;

  if p_mode <> 'name' then
    return;
  end if;

  v_normalized_query := public.normalize_candidature_name(v_query);
  if length(v_normalized_query) < 3 or length(v_normalized_query) > 120 then
    return;
  end if;

  return query
    select r.id, r.receipt_number, r.name_ar, r.name_fr, t.code, t.name_ar,
           r.status, r.rejection_reason, r.source_file
    from public.competition_candidatures r
    join public.competition_tracks t on t.id = r.track_id
    where r.competition_id = v_competition_id
      and r.search_name ilike '%' || v_normalized_query || '%'
      and (coalesce(btrim(p_track_code), '') = '' or t.code = btrim(p_track_code))
    order by
      (r.search_name = v_normalized_query) desc,
      (r.search_name like v_normalized_query || '%') desc,
      position(v_normalized_query in r.search_name),
      length(r.search_name),
      t.sort_order,
      r.id
    limit v_limit;
end;
$$;

revoke execute on function public.search_public_competition_candidatures(text, text, text, text, integer) from anon, authenticated;
grant execute on function public.search_public_competition_candidatures(text, text, text, text, integer) to service_role;

notify pgrst, 'reload schema';
