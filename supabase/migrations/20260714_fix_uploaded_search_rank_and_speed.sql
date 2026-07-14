-- Keep uploaded-result searches on the configured ranked view so the public
-- result card receives the real database rank instead of assigning rank 1 to
-- every exact search result. This migration is idempotent and does not alter data.

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
  e public.published_exams%rowtype;
  relation_name text;
  sql_text text;
  q text := btrim(coalesce(p_query, ''));
  numeric_variants text[];
  numeric_value text;
  has_rank boolean := false;
begin
  select * into e
  from public.published_exams
  where source_key = p_source_key
    and is_active = true
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'Active uploaded exam not found';
  end if;

  if q = '' then
    return;
  end if;

  if e.table_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then
    raise exception 'Invalid uploaded results table';
  end if;

  relation_name := coalesce(
    nullif(e.ranked_view, ''),
    regexp_replace(e.table_name, '_results$', '') || '_ranked_results'
  );

  if relation_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$'
     or to_regclass(format('public.%I', relation_name)) is null then
    relation_name := e.table_name;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = relation_name
      and column_name = 'rank'
  ) into has_rank;

  if q ~ '^[0-9]+$' then
    numeric_value := (q::numeric)::text;
    numeric_variants := array[
      q,
      numeric_value,
      lpad(numeric_value, 3, '0'),
      lpad(numeric_value, 4, '0'),
      lpad(numeric_value, 5, '0'),
      lpad(numeric_value, 6, '0'),
      lpad(numeric_value, 7, '0'),
      lpad(numeric_value, 8, '0')
    ];

    sql_text := format(
      'select to_jsonb(t) from public.%I t where btrim(t.%I::text) = any($1)',
      relation_name,
      e.number_column
    );
  else
    numeric_variants := null;
    sql_text := format(
      'select to_jsonb(t) from public.%I t where t.%I::text ilike $2',
      relation_name,
      e.name_column
    );
  end if;

  if e.search_mode = 'concours' then
    if coalesce(btrim(p_wilaya), '') = ''
       or coalesce(btrim(p_moughataa), '') = ''
       or coalesce(btrim(p_centre), '') = '' then
      raise exception 'Location fields are required for concours search';
    end if;

    if coalesce(e.wilaya_column, '') = ''
       or coalesce(e.moughataa_column, '') = ''
       or coalesce(e.centre_column, '') = '' then
      raise exception 'Concours location mappings are incomplete';
    end if;

    sql_text := sql_text || format(
      ' and btrim(t.%I::text) = btrim($3) and btrim(t.%I::text) = btrim($4) and btrim(t.%I::text) = btrim($5)',
      e.wilaya_column,
      e.moughataa_column,
      e.centre_column
    );
  end if;

  if has_rank then
    sql_text := sql_text || ' order by t.rank asc nulls last';
  else
    sql_text := sql_text || format(
      ' order by nullif(regexp_replace(replace(t.%I::text, '','', ''.''), ''[^0-9.-]'', '''', ''g''), '''')::numeric desc nulls last',
      e.score_column
    );
  end if;

  sql_text := sql_text || ' limit 20';

  if q ~ '^[0-9]+$' then
    return query execute sql_text
      using numeric_variants, null::text, p_wilaya, p_moughataa, p_centre;
  else
    return query execute sql_text
      using null::text[], '%' || q || '%', p_wilaya, p_moughataa, p_centre;
  end if;
end;
$$;

revoke all on function public.search_uploaded_exam_rows(text, text, text, text, text) from public;
grant execute on function public.search_uploaded_exam_rows(text, text, text, text, text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
