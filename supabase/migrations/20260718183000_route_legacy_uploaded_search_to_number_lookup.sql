-- Keep the currently deployed API and older native clients compatible with the
-- exact-number lookup while the number-only web release rolls out.

create or replace function public.search_uploaded_exam_rows(
  p_source_key text,
  p_query text,
  p_wilaya text default null,
  p_moughataa text default null,
  p_centre text default null
)
returns setof jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate_key text;
  v_search_mode text;
begin
  v_candidate_key := public.result_candidate_key(btrim(coalesce(p_query, '')));

  -- Name and partial-name searches are disabled. Returning an empty set keeps
  -- older clients compatible while the current web/API version returns 400.
  if v_candidate_key is null then
    return;
  end if;

  select coalesce(search_mode, 'simple')
  into v_search_mode
  from public.published_exams
  where source_key = p_source_key
    and is_active = true
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'Active uploaded exam not found';
  end if;

  if v_search_mode = 'concours' then
    if coalesce(btrim(p_wilaya), '') = ''
       or coalesce(btrim(p_moughataa), '') = ''
       or coalesce(btrim(p_centre), '') = '' then
      raise exception 'Location fields are required for concours search';
    end if;

    return query
    select l.payload
    from public.result_number_lookup l
    where l.source_key = p_source_key
      and l.candidate_key = v_candidate_key
      and l.wilaya = btrim(p_wilaya)
      and l.moughataa = btrim(p_moughataa)
      and l.centre = btrim(p_centre)
    order by l.rank asc nulls last
    limit 20;
    return;
  end if;

  return query
  select l.payload
  from public.result_number_lookup l
  where l.source_key = p_source_key
    and l.candidate_key = v_candidate_key
  order by l.rank asc nulls last
  limit 20;
end;
$$;

revoke execute on function public.search_uploaded_exam_rows(text,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.search_uploaded_exam_rows(text,text,text,text,text)
  to service_role;

notify pgrst, 'reload schema';
