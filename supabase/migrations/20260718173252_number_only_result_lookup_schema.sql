-- MauriResults exact-number search architecture.
-- Public search reads this compact precomputed table instead of executing a
-- dynamic query against a results table on every request.

create table if not exists public.result_number_lookup (
  source_key text not null,
  candidate_key text not null,
  row_key text not null,
  rank bigint,
  wilaya text not null default '',
  moughataa text not null default '',
  centre text not null default '',
  payload jsonb not null,
  refreshed_at timestamptz not null default now(),
  primary key (source_key, candidate_key, row_key)
);

comment on table public.result_number_lookup is
  'Precomputed exact candidate-number lookup used by MauriResults high-traffic search.';

create index if not exists result_number_lookup_concours_idx
  on public.result_number_lookup
  (source_key, candidate_key, wilaya, moughataa, centre, rank);

alter table public.result_number_lookup enable row level security;
revoke all on table public.result_number_lookup from public, anon, authenticated;
grant select, insert, update, delete on table public.result_number_lookup to service_role;

create or replace function public.result_candidate_key(p_value text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select case
    when btrim(p_value) ~ '^[0-9]+$'
      then coalesce(nullif(ltrim(btrim(p_value), '0'), ''), '0')
    else null
  end;
$$;

revoke execute on function public.result_candidate_key(text)
  from public, anon, authenticated;
grant execute on function public.result_candidate_key(text) to service_role;

create or replace function public.refresh_result_number_lookup(p_source_key text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_table_name text;
  v_number_column text;
  v_search_mode text := 'simple';
  v_wilaya_column text;
  v_moughataa_column text;
  v_centre_column text;
  v_rank_expr text;
  v_wilaya_expr text;
  v_moughataa_expr text;
  v_centre_expr text;
  v_sql text;
  v_inserted bigint := 0;
  v_added bigint := 0;
  v_has_nodoss boolean := false;
begin
  select
    e.table_name,
    e.number_column,
    coalesce(e.search_mode, 'simple'),
    nullif(btrim(e.wilaya_column), ''),
    nullif(btrim(e.moughataa_column), ''),
    nullif(btrim(e.centre_column), '')
  into
    v_table_name,
    v_number_column,
    v_search_mode,
    v_wilaya_column,
    v_moughataa_column,
    v_centre_column
  from public.published_exams e
  where e.source_key = p_source_key
  order by e.created_at desc
  limit 1;

  if not found then
    case p_source_key
      when 'bac' then
        v_table_name := 'bac_results';
        v_number_column := 'Numero';
        v_wilaya_column := 'WL';
        v_moughataa_column := 'MD';
      when 'brevet' then
        v_table_name := 'brevet_results';
        v_number_column := 'Num_Bepc';
        v_wilaya_column := 'WILAYA';
        v_centre_column := 'Centre';
      when 'concours' then
        v_table_name := 'concours_results';
        v_number_column := 'Numéro_C1AS';
        v_search_mode := 'concours';
        v_wilaya_column := 'WILAYA_AR';
        v_moughataa_column := 'MOUGHATAA_AR';
        v_centre_column := 'Centre Examen_AR';
      when 'bac_session' then
        v_table_name := 'bac_session2_results';
        v_number_column := 'NODOSS';
        v_wilaya_column := 'Wilaya_AR';
        v_centre_column := 'Centre Examen_AR';
      when 'excellence_1as' then
        v_table_name := 'excellence_1as_results';
        v_number_column := 'Num_Excellence_1AS';
        v_wilaya_column := 'Wilaya_AR';
        v_centre_column := 'CENTRE_AR';
      else
        raise exception 'Unknown result source: %', p_source_key;
    end case;
  end if;

  if v_table_name is null
     or v_table_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$'
     or to_regclass(format('public.%I', v_table_name)) is null then
    raise exception 'Invalid or missing results table for source %', p_source_key;
  end if;

  if coalesce(btrim(v_number_column), '') = ''
     or not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = v_table_name
         and column_name = v_number_column
     ) then
    raise exception 'Candidate-number column is missing for source %', p_source_key;
  end if;

  if v_wilaya_column is not null and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = v_table_name
      and column_name = v_wilaya_column
  ) then
    v_wilaya_column := null;
  end if;

  if v_moughataa_column is not null and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = v_table_name
      and column_name = v_moughataa_column
  ) then
    v_moughataa_column := null;
  end if;

  if v_centre_column is not null and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = v_table_name
      and column_name = v_centre_column
  ) then
    v_centre_column := null;
  end if;

  v_rank_expr := case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = v_table_name
      and column_name = 'rank'
  ) then 't.rank::bigint' else 'null::bigint' end;

  v_wilaya_expr := case when v_wilaya_column is null
    then quote_literal('')
    else format('coalesce(btrim(t.%I::text), '''')', v_wilaya_column)
  end;
  v_moughataa_expr := case when v_moughataa_column is null
    then quote_literal('')
    else format('coalesce(btrim(t.%I::text), '''')', v_moughataa_column)
  end;
  v_centre_expr := case when v_centre_column is null
    then quote_literal('')
    else format('coalesce(btrim(t.%I::text), '''')', v_centre_column)
  end;

  delete from public.result_number_lookup
  where source_key = p_source_key;

  v_sql := format(
    'insert into public.result_number_lookup
       (source_key, candidate_key, row_key, rank, wilaya, moughataa, centre, payload, refreshed_at)
     select %L,
            public.result_candidate_key(t.%I::text),
            t.ctid::text,
            %s,
            %s,
            %s,
            %s,
            to_jsonb(t) - ''__row_id'',
            now()
     from public.%I t
     where btrim(coalesce(t.%I::text, '''')) ~ ''^[0-9]+$''
     on conflict do nothing',
    p_source_key,
    v_number_column,
    v_rank_expr,
    v_wilaya_expr,
    v_moughataa_expr,
    v_centre_expr,
    v_table_name,
    v_number_column
  );
  execute v_sql;
  get diagnostics v_inserted = row_count;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = v_table_name
      and column_name = 'NODOSS'
  ) into v_has_nodoss;

  -- Concours has a centre-local number and a globally unique NODOSS number.
  -- Store both aliases without changing the public result payload.
  if v_search_mode = 'concours'
     and v_has_nodoss
     and v_number_column <> 'NODOSS' then
    v_sql := format(
      'insert into public.result_number_lookup
         (source_key, candidate_key, row_key, rank, wilaya, moughataa, centre, payload, refreshed_at)
       select %L,
              public.result_candidate_key(t.%I::text),
              ''nodoss:'' || t.ctid::text,
              %s,
              %s,
              %s,
              %s,
              to_jsonb(t) - ''__row_id'',
              now()
       from public.%I t
       where btrim(coalesce(t.%I::text, '''')) ~ ''^[0-9]+$''
       on conflict do nothing',
      p_source_key,
      'NODOSS',
      v_rank_expr,
      v_wilaya_expr,
      v_moughataa_expr,
      v_centre_expr,
      v_table_name,
      'NODOSS'
    );
    execute v_sql;
    get diagnostics v_added = row_count;
    v_inserted := v_inserted + v_added;
  end if;

  return jsonb_build_object(
    'ok', true,
    'source', p_source_key,
    'table', v_table_name,
    'lookup_rows', v_inserted,
    'number_only', true
  );
end;
$$;

revoke execute on function public.refresh_result_number_lookup(text)
  from public, anon, authenticated;
grant execute on function public.refresh_result_number_lookup(text) to service_role;

-- Future result uploads retain exact-number and location indexes, but no longer
-- create a trigram name index.
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
set search_path = public, extensions
as $$
declare
  v_score_expression text;
  v_index text;
  v_column text;
begin
  if p_table_name is null
     or p_table_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then
    raise exception 'Invalid table name';
  end if;
  if to_regclass(format('public.%I', p_table_name)) is null then
    raise exception 'Table does not exist: %', p_table_name;
  end if;

  foreach v_column in array array[p_number_column, p_name_column, p_score_column] loop
    if coalesce(btrim(v_column), '') = '' or not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = p_table_name
        and column_name = v_column
    ) then
      raise exception 'Required column missing: %', v_column;
    end if;
  end loop;

  execute format(
    'alter table public.%I add column if not exists rank bigint',
    p_table_name
  );

  v_score_expression := format(
    'nullif(regexp_replace(replace(coalesce(%I::text, ''''), '','', ''.''), ''[^0-9.\\-]'', '''', ''g''), '''')::numeric',
    p_score_column
  );

  execute format(
    'with ranked as (
       select ctid,
              row_number() over (
                order by %s desc nulls last, %I::text asc
              ) as new_rank
       from public.%I
     )
     update public.%I t
     set rank = ranked.new_rank
     from ranked
     where t.ctid = ranked.ctid
       and t.rank is distinct from ranked.new_rank',
    v_score_expression,
    p_number_column,
    p_table_name,
    p_table_name
  );

  v_index := 'idx_' || substr(
    md5(p_table_name || '_candidate_number_v2_' || p_number_column),
    1,
    20
  );
  execute format(
    'create index if not exists %I on public.%I (%I)',
    v_index,
    p_table_name,
    p_number_column
  );

  v_index := 'idx_' || substr(md5(p_table_name || '_rank_v2'), 1, 20);
  execute format(
    'create index if not exists %I on public.%I (rank)',
    v_index,
    p_table_name
  );

  if coalesce(btrim(p_wilaya_column), '') <> '' then
    v_index := 'idx_' || substr(
      md5(p_table_name || '_wilaya_v2_' || p_wilaya_column),
      1,
      20
    );
    execute format(
      'create index if not exists %I on public.%I (%I)',
      v_index,
      p_table_name,
      p_wilaya_column
    );
  end if;

  if coalesce(btrim(p_moughataa_column), '') <> '' then
    v_index := 'idx_' || substr(
      md5(p_table_name || '_moughataa_v2_' || p_moughataa_column),
      1,
      20
    );
    execute format(
      'create index if not exists %I on public.%I (%I)',
      v_index,
      p_table_name,
      p_moughataa_column
    );
  end if;

  if coalesce(btrim(p_centre_column), '') <> '' then
    v_index := 'idx_' || substr(
      md5(p_table_name || '_centre_v2_' || p_centre_column),
      1,
      20
    );
    execute format(
      'create index if not exists %I on public.%I (%I)',
      v_index,
      p_table_name,
      p_centre_column
    );
  end if;

  if coalesce(btrim(p_wilaya_column), '') <> ''
     and coalesce(btrim(p_moughataa_column), '') <> ''
     and coalesce(btrim(p_centre_column), '') <> '' then
    v_index := 'idx_' || substr(
      md5(p_table_name || '_concours_path_v2'),
      1,
      20
    );
    execute format(
      'create index if not exists %I on public.%I (%I, %I, %I, %I)',
      v_index,
      p_table_name,
      p_wilaya_column,
      p_moughataa_column,
      p_centre_column,
      p_number_column
    );
  end if;

  execute format('analyze public.%I', p_table_name);

  return jsonb_build_object(
    'ok', true,
    'table', p_table_name,
    'ranked_view', p_table_name,
    'persisted_rank', true,
    'name_search', false
  );
end;
$$;

revoke execute on function public.ensure_persisted_exam_rank(
  text, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.ensure_persisted_exam_rank(
  text, text, text, text, text, text, text
) to service_role;

-- Remove the large write-heavy name-search indexes. Names remain in result
-- payloads and statistics, but they are no longer searchable.
do $$
declare
  r record;
begin
  for r in
    select i.indexname
    from pg_indexes i
    where i.schemaname = 'public'
      and i.indexdef ilike '%gin_trgm_ops%'
      and (
        i.tablename in (
          'bac_results',
          'brevet_results',
          'concours_results',
          'bac_session2_results',
          'excellence_1as_results'
        )
        or i.tablename in (
          select e.table_name from public.published_exams e
        )
      )
  loop
    execute format('drop index if exists public.%I', r.indexname);
  end loop;
end;
$$;

-- Initial production backfill. Future uploads are refreshed by the publish API.
set local statement_timeout = '15min';
select public.refresh_result_number_lookup('bac');
select public.refresh_result_number_lookup('brevet');
select public.refresh_result_number_lookup('concours');
select public.refresh_result_number_lookup('bac_session');
select public.refresh_result_number_lookup('excellence_1as');
select public.refresh_result_number_lookup(source_key)
from public.published_exams
where is_active = true;

analyze public.result_number_lookup;
notify pgrst, 'reload schema';
