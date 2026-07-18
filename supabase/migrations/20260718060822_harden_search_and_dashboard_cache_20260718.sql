-- MauriResults high-traffic hardening.
-- Candidate lookup uses indexed base tables with a persisted rank. Uploaded
-- analytics are calculated at publication time and served from a cache table.

create extension if not exists pg_trgm;

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
set search_path = public
as $$
declare
  v_score_expression text;
  v_index text;
  v_column text;
begin
  if p_table_name is null or p_table_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then
    raise exception 'Invalid table name';
  end if;
  if to_regclass(format('public.%I', p_table_name)) is null then
    raise exception 'Table does not exist: %', p_table_name;
  end if;

  foreach v_column in array array[p_number_column, p_name_column, p_score_column] loop
    if coalesce(btrim(v_column), '') = '' or not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = p_table_name and column_name = v_column
    ) then
      raise exception 'Required column missing: %', v_column;
    end if;
  end loop;

  execute format('alter table public.%I add column if not exists rank bigint', p_table_name);
  v_score_expression := format(
    'nullif(regexp_replace(replace(coalesce(%I::text, ''''), '','', ''.''), ''[^0-9.\\-]'', '''', ''g''), '''')::numeric',
    p_score_column
  );

  execute format(
    'with ranked as (
       select ctid, row_number() over (order by %s desc nulls last, %I::text asc) as new_rank
       from public.%I
     )
     update public.%I t
     set rank = ranked.new_rank
     from ranked
     where t.ctid = ranked.ctid
       and t.rank is distinct from ranked.new_rank',
    v_score_expression, p_number_column, p_table_name, p_table_name
  );

  v_index := 'idx_' || substr(md5(p_table_name || '_candidate_number_v2_' || p_number_column), 1, 20);
  execute format('create index if not exists %I on public.%I (%I)', v_index, p_table_name, p_number_column);

  v_index := 'idx_' || substr(md5(p_table_name || '_name_trgm_v2_' || p_name_column), 1, 20);
  execute format('create index if not exists %I on public.%I using gin (lower(%I::text) gin_trgm_ops)', v_index, p_table_name, p_name_column);

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
  if coalesce(btrim(p_wilaya_column), '') <> ''
     and coalesce(btrim(p_moughataa_column), '') <> ''
     and coalesce(btrim(p_centre_column), '') <> '' then
    v_index := 'idx_' || substr(md5(p_table_name || '_concours_path_v2'), 1, 20);
    execute format(
      'create index if not exists %I on public.%I (%I, %I, %I, %I)',
      v_index, p_table_name, p_wilaya_column, p_moughataa_column, p_centre_column, p_number_column
    );
  end if;

  execute format('analyze public.%I', p_table_name);
  return jsonb_build_object('ok', true, 'table', p_table_name, 'ranked_view', p_table_name, 'persisted_rank', true);
end;
$$;

revoke all on function public.ensure_persisted_exam_rank(text,text,text,text,text,text,text) from public;
grant execute on function public.ensure_persisted_exam_rank(text,text,text,text,text,text,text) to service_role;

create or replace function public.prepare_results_table_speed(
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
set search_path = public
as $$
begin
  return public.ensure_persisted_exam_rank(
    p_table_name, p_number_column, p_name_column, p_score_column,
    p_wilaya_column, p_moughataa_column, p_centre_column
  );
end;
$$;

revoke all on function public.prepare_results_table_speed(text,text,text,text,text,text,text) from public;
grant execute on function public.prepare_results_table_speed(text,text,text,text,text,text,text) to service_role;

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
  sql_text text;
  q text := btrim(coalesce(p_query, ''));
  numeric_variants text[];
  numeric_value text;
  has_rank boolean := false;
begin
  select * into e
  from public.published_exams
  where source_key = p_source_key and is_active = true
  order by created_at desc
  limit 1;

  if not found then raise exception 'Active uploaded exam not found'; end if;
  if q = '' then return; end if;
  if e.table_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then raise exception 'Invalid uploaded results table'; end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = e.table_name and column_name = 'rank'
  ) into has_rank;

  if q ~ '^[0-9]+$' then
    numeric_value := coalesce(nullif(ltrim(q, '0'), ''), '0');
    numeric_variants := array[
      q, numeric_value,
      lpad(numeric_value, 3, '0'), lpad(numeric_value, 4, '0'),
      lpad(numeric_value, 5, '0'), lpad(numeric_value, 6, '0'),
      lpad(numeric_value, 7, '0'), lpad(numeric_value, 8, '0')
    ];
    sql_text := format(
      'select to_jsonb(t) from public.%I t where btrim(t.%I::text) = any($1)',
      e.table_name, e.number_column
    );
  else
    numeric_variants := null;
    sql_text := format(
      'select to_jsonb(t) from public.%I t where lower(t.%I::text) like lower($2)',
      e.table_name, e.name_column
    );
  end if;

  if e.search_mode = 'concours' then
    if coalesce(btrim(p_wilaya), '') = ''
       or coalesce(btrim(p_moughataa), '') = ''
       or coalesce(btrim(p_centre), '') = '' then
      raise exception 'Location fields are required for concours search';
    end if;
    sql_text := sql_text || format(
      ' and btrim(t.%I::text)=btrim($3) and btrim(t.%I::text)=btrim($4) and btrim(t.%I::text)=btrim($5)',
      e.wilaya_column, e.moughataa_column, e.centre_column
    );
  end if;

  if has_rank then sql_text := sql_text || ' order by t.rank asc nulls last'; end if;
  sql_text := sql_text || ' limit 20';

  if q ~ '^[0-9]+$' then
    return query execute sql_text using numeric_variants, null::text, p_wilaya, p_moughataa, p_centre;
  else
    return query execute sql_text using null::text[], '%' || q || '%', p_wilaya, p_moughataa, p_centre;
  end if;
end;
$$;

revoke all on function public.search_uploaded_exam_rows(text,text,text,text,text) from public;
grant execute on function public.search_uploaded_exam_rows(text,text,text,text,text) to service_role;

create table if not exists public.published_exam_dashboard_cache (
  source_key text primary key references public.published_exams(source_key) on delete cascade,
  payload jsonb not null,
  refreshed_at timestamptz not null default now()
);

alter table public.published_exam_dashboard_cache enable row level security;
revoke all on table public.published_exam_dashboard_cache from anon, authenticated;
grant select, insert, update, delete on table public.published_exam_dashboard_cache to service_role;

create or replace function public.refresh_published_exam_dashboard_cache(p_source_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  result := public.get_published_exam_dashboard(p_source_key, true);
  insert into public.published_exam_dashboard_cache(source_key, payload, refreshed_at)
  values (p_source_key, result, now())
  on conflict (source_key) do update
    set payload = excluded.payload, refreshed_at = excluded.refreshed_at;
  return result;
end;
$$;

revoke all on function public.refresh_published_exam_dashboard_cache(text) from public;
grant execute on function public.refresh_published_exam_dashboard_cache(text) to service_role;

create or replace function public.get_cached_published_exam_dashboard(p_source_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select payload into result
  from public.published_exam_dashboard_cache
  where source_key = p_source_key;
  if result is not null then return result; end if;

  perform pg_advisory_xact_lock(hashtext('mauriresults-dashboard:' || p_source_key));
  select payload into result
  from public.published_exam_dashboard_cache
  where source_key = p_source_key;
  if result is not null then return result; end if;

  return public.refresh_published_exam_dashboard_cache(p_source_key);
end;
$$;

revoke all on function public.get_cached_published_exam_dashboard(text) from public;
grant execute on function public.get_cached_published_exam_dashboard(text) to service_role;

-- Built-in tables. Uploaded tables are prepared by the admin upload flow.
select public.ensure_persisted_exam_rank('bac_results','Numero','NOM','MOD','WL',null,null);
select public.ensure_persisted_exam_rank('brevet_results','Num_Bepc','NOM','Moyenne_Bepc','WILAYA',null,'Centre');
select public.ensure_persisted_exam_rank('concours_results','Numéro_C1AS','NOM_AR','TOTAL','WILAYA_AR','MOUGHATAA_AR','Centre Examen_AR');
select public.ensure_persisted_exam_rank('bac_session2_results','NODOSS','NOM_AR','Moy Bac_Session','Wilaya_AR',null,'Centre Examen_AR');
select public.ensure_persisted_exam_rank('excellence_1as_results','Num_Excellence_1AS','Nom','Mgex','Wilaya_AR',null,'CENTRE_AR');

update public.published_exams set ranked_view = table_name;
select public.refresh_published_exam_dashboard_cache(source_key)
from public.published_exams
where is_active = true;

notify pgrst, 'reload schema';
