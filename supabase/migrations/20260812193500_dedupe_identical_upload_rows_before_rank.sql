create or replace function public.ensure_persisted_exam_rank(
  p_table_name text,
  p_number_column text,
  p_name_column text,
  p_score_column text,
  p_wilaya_column text default null,
  p_moughataa_column text default null,
  p_centre_column text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_score_expression text;
  v_index text;
  v_column text;
  v_removed bigint := 0;
begin
  if p_table_name is null or p_table_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then raise exception 'Invalid table name'; end if;
  if to_regclass(format('public.%I', p_table_name)) is null then raise exception 'Table does not exist: %', p_table_name; end if;
  foreach v_column in array array[p_number_column, p_name_column, p_score_column] loop
    if coalesce(btrim(v_column), '') = '' or not exists (
      select 1 from information_schema.columns where table_schema = 'public' and table_name = p_table_name and column_name = v_column
    ) then raise exception 'Required column missing: %', v_column; end if;
  end loop;

  execute format('alter table public.%I add column if not exists rank bigint', p_table_name);

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name=p_table_name and column_name='__row_id'
  ) then
    execute format(
      'with duplicates as (
         select ctid,
                row_number() over (
                  partition by (to_jsonb(t) - ''__row_id'' - ''rank'')
                  order by __row_id
                ) as rn
         from public.%I t
       )
       delete from public.%I t
       using duplicates d
       where t.ctid=d.ctid and d.rn>1',
      p_table_name, p_table_name
    );
    get diagnostics v_removed = row_count;
  end if;

  v_score_expression := format('nullif(regexp_replace(replace(coalesce(%I::text, ''''), '','', ''.''), ''[^0-9.\\-]'', '''', ''g''), '''')::numeric', p_score_column);
  execute format(
    'with ranked as (select ctid, row_number() over (order by %s desc nulls last, %I::text asc) as new_rank from public.%I)
     update public.%I t set rank = ranked.new_rank from ranked where t.ctid = ranked.ctid and t.rank is distinct from ranked.new_rank',
    v_score_expression, p_number_column, p_table_name, p_table_name
  );

  v_index := 'idx_' || substr(md5(p_table_name || '_candidate_number_v2_' || p_number_column), 1, 20);
  execute format('create index if not exists %I on public.%I (%I)', v_index, p_table_name, p_number_column);
  v_index := 'idx_' || substr(md5(p_table_name || '_rank_v2'), 1, 20);
  execute format('create index if not exists %I on public.%I (rank)', v_index, p_table_name);
  if coalesce(btrim(p_wilaya_column), '') <> '' then
    v_index := 'idx_' || substr(md5(p_table_name || '_wilaya_v2_' || p_wilaya_column), 1, 20);
    execute format('create index if not exists %I on public.%I (%I)', v_index, p_table_name, p_wilaya_column);
  end if;
  if coalesce(btrim(p_moughataa_column), '') <> '' then
    v_index := 'idx_' || substr(md5(p_table_name || '_moughataa_v2_' || p_moughataa_column), 1, 20);
    execute format('create index if not exists %I on public.%I (%I)', v_index, p_table_name, p_moughataa_column);
  end if;
  if coalesce(btrim(p_centre_column), '') <> '' then
    v_index := 'idx_' || substr(md5(p_table_name || '_centre_v2_' || p_centre_column), 1, 20);
    execute format('create index if not exists %I on public.%I (%I)', v_index, p_table_name, p_centre_column);
  end if;
  if coalesce(btrim(p_wilaya_column), '') <> '' and coalesce(btrim(p_moughataa_column), '') <> '' and coalesce(btrim(p_centre_column), '') <> '' then
    v_index := 'idx_' || substr(md5(p_table_name || '_concours_path_v2'), 1, 20);
    execute format('create index if not exists %I on public.%I (%I, %I, %I, %I)', v_index, p_table_name, p_wilaya_column, p_moughataa_column, p_centre_column, p_number_column);
  end if;
  execute format('analyze public.%I', p_table_name);
  return jsonb_build_object('ok', true, 'table', p_table_name, 'ranked_view', p_table_name, 'persisted_rank', true, 'name_search', false, 'duplicates_removed', v_removed);
end;
$function$;
