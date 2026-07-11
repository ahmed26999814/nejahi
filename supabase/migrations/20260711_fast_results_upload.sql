-- Fast XLS/XLSX results upload support for MauriResults
-- Run this file once in Supabase SQL Editor.

create extension if not exists pg_trgm;

create or replace function public.create_results_upload_table(
  p_table_name text,
  p_columns text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_column text;
  v_defs text := '';
  v_safe_columns text[] := array[]::text[];
begin
  if p_table_name is null or p_table_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then
    raise exception 'Invalid table name';
  end if;

  if p_columns is null or array_length(p_columns, 1) is null then
    raise exception 'At least one column is required';
  end if;

  foreach v_column in array p_columns loop
    v_column := btrim(replace(v_column, chr(0), ''));
    if v_column <> '' and length(v_column) <= 120 and not (v_column = any(v_safe_columns)) then
      v_safe_columns := array_append(v_safe_columns, v_column);
      v_defs := v_defs || case when v_defs = '' then '' else ', ' end || format('%I text', v_column);
    end if;
  end loop;

  if v_defs = '' then
    raise exception 'No valid columns supplied';
  end if;

  execute format('create table if not exists public.%I (%s)', p_table_name, v_defs);
  execute format('alter table public.%I enable row level security', p_table_name);

  begin
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      'public_read_' || substr(md5(p_table_name), 1, 12),
      p_table_name
    );
  exception when duplicate_object then
    null;
  end;

  execute format('grant select on public.%I to anon, authenticated', p_table_name);
  execute format('grant all on public.%I to service_role', p_table_name);

  return jsonb_build_object(
    'ok', true,
    'table', p_table_name,
    'columns', v_safe_columns
  );
end;
$$;

create or replace function public.insert_results_upload_rows(
  p_table_name text,
  p_rows jsonb,
  p_columns text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_column text;
  v_columns_sql text := '';
  v_record_sql text := '';
  v_safe_columns text[] := array[]::text[];
  v_inserted bigint := 0;
begin
  if p_table_name is null or p_table_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then
    raise exception 'Invalid table name';
  end if;

  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'Rows must be a non-empty JSON array';
  end if;

  foreach v_column in array p_columns loop
    v_column := btrim(replace(v_column, chr(0), ''));
    if v_column <> '' and length(v_column) <= 120 and not (v_column = any(v_safe_columns)) then
      v_safe_columns := array_append(v_safe_columns, v_column);
      v_columns_sql := v_columns_sql || case when v_columns_sql = '' then '' else ', ' end || format('%I', v_column);
      v_record_sql := v_record_sql || case when v_record_sql = '' then '' else ', ' end || format('%I text', v_column);
    end if;
  end loop;

  if v_columns_sql = '' then
    raise exception 'No valid columns supplied';
  end if;

  execute format(
    'insert into public.%I (%s) select %s from jsonb_to_recordset($1) as x(%s)',
    p_table_name,
    v_columns_sql,
    v_columns_sql,
    v_record_sql
  ) using p_rows;

  get diagnostics v_inserted = row_count;
  return jsonb_build_object('ok', true, 'table', p_table_name, 'inserted', v_inserted);
end;
$$;

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
declare
  v_ranked_view text;
  v_score_expression text;
  v_index text;
begin
  if p_table_name is null or p_table_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then
    raise exception 'Invalid table name';
  end if;

  if coalesce(btrim(p_number_column), '') = ''
     or coalesce(btrim(p_name_column), '') = ''
     or coalesce(btrim(p_score_column), '') = '' then
    raise exception 'Number, name and score columns are required';
  end if;

  v_index := 'idx_' || substr(md5(p_table_name || '_number_' || p_number_column), 1, 20);
  execute format('create index if not exists %I on public.%I (%I)', v_index, p_table_name, p_number_column);

  v_index := 'idx_' || substr(md5(p_table_name || '_name_lower_' || p_name_column), 1, 20);
  execute format('create index if not exists %I on public.%I (lower(%I) text_pattern_ops)', v_index, p_table_name, p_name_column);

  v_index := 'idx_' || substr(md5(p_table_name || '_name_trgm_' || p_name_column), 1, 20);
  execute format('create index if not exists %I on public.%I using gin (lower(%I) gin_trgm_ops)', v_index, p_table_name, p_name_column);

  if coalesce(btrim(p_wilaya_column), '') <> '' then
    v_index := 'idx_' || substr(md5(p_table_name || '_wilaya_' || p_wilaya_column), 1, 20);
    execute format('create index if not exists %I on public.%I (%I)', v_index, p_table_name, p_wilaya_column);
  end if;

  if coalesce(btrim(p_moughataa_column), '') <> '' then
    v_index := 'idx_' || substr(md5(p_table_name || '_moughataa_' || p_moughataa_column), 1, 20);
    execute format('create index if not exists %I on public.%I (%I)', v_index, p_table_name, p_moughataa_column);
  end if;

  if coalesce(btrim(p_centre_column), '') <> '' then
    v_index := 'idx_' || substr(md5(p_table_name || '_centre_' || p_centre_column), 1, 20);
    execute format('create index if not exists %I on public.%I (%I)', v_index, p_table_name, p_centre_column);
  end if;

  if coalesce(btrim(p_wilaya_column), '') <> ''
     and coalesce(btrim(p_moughataa_column), '') <> ''
     and coalesce(btrim(p_centre_column), '') <> '' then
    v_index := 'idx_' || substr(md5(p_table_name || '_concours_path'), 1, 20);
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

  v_score_expression := format(
    'nullif(regexp_replace(replace(coalesce(%I, ''''), '','', ''.''), ''[^0-9.\-]'', '''', ''g''), '''')::numeric',
    p_score_column
  );

  v_ranked_view := regexp_replace(p_table_name, '_results$', '') || '_ranked_results';
  execute format(
    'create or replace view public.%I as select t.*, rank() over (order by %s desc nulls last) as rank from public.%I t',
    v_ranked_view,
    v_score_expression,
    p_table_name
  );

  execute format('grant select on public.%I to anon, authenticated', v_ranked_view);
  execute format('analyze public.%I', p_table_name);

  return jsonb_build_object(
    'ok', true,
    'table', p_table_name,
    'ranked_view', v_ranked_view,
    'analyzed', true
  );
end;
$$;

revoke all on function public.create_results_upload_table(text, text[]) from public;
revoke all on function public.insert_results_upload_rows(text, jsonb, text[]) from public;
revoke all on function public.prepare_results_table_speed(text, text, text, text, text, text, text) from public;

grant execute on function public.create_results_upload_table(text, text[]) to service_role;
grant execute on function public.insert_results_upload_rows(text, jsonb, text[]) to service_role;
grant execute on function public.prepare_results_table_speed(text, text, text, text, text, text, text) to service_role;
