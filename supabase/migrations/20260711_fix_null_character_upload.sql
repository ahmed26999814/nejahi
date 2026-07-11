-- Fix: PostgreSQL chr(0) itself raises "null character not permitted".
-- Run this once in Supabase SQL Editor after the fast upload migration.

begin;

drop function if exists public.create_results_upload_table(text, text[]);
drop function if exists public.insert_results_upload_rows(text, jsonb, text[]);

create function public.create_results_upload_table(
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
    v_column := btrim(v_column);
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

create function public.insert_results_upload_rows(
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
    v_column := btrim(v_column);
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

revoke all on function public.create_results_upload_table(text, text[]) from public;
revoke all on function public.insert_results_upload_rows(text, jsonb, text[]) from public;

grant execute on function public.create_results_upload_table(text, text[]) to service_role;
grant execute on function public.insert_results_upload_rows(text, jsonb, text[]) to service_role;

commit;
