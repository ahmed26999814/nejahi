-- MauriResults: insert uploaded XLSX rows into dynamically created tables
-- without waiting for PostgREST schema cache to detect the new table.
-- Run once in Supabase SQL Editor.

create or replace function public.insert_results_upload_rows(
  p_table_name text,
  p_rows jsonb,
  p_columns text[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_table text;
  col text;
  clean_columns text[] := array[]::text[];
  col_names text;
  col_defs text;
  select_names text;
  inserted_count integer := 0;
  sql text;
begin
  clean_table := trim(coalesce(p_table_name, ''));

  if clean_table !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then
    raise exception 'Invalid table name: %', clean_table;
  end if;

  if to_regclass(format('public.%I', clean_table)) is null then
    raise exception 'Table does not exist: %', clean_table;
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'No rows supplied';
  end if;

  if p_columns is null or array_length(p_columns, 1) is null then
    select array_agg(key order by key)
    into clean_columns
    from jsonb_object_keys(coalesce(p_rows->0, '{}'::jsonb)) as key;
  else
    foreach col in array p_columns loop
      col := trim(coalesce(col, ''));
      if col = '' then
        continue;
      end if;
      if not (col = any(clean_columns)) then
        clean_columns := clean_columns || col;
      end if;
    end loop;
  end if;

  if array_length(clean_columns, 1) is null then
    raise exception 'No columns supplied';
  end if;

  -- Only keep columns that actually exist in the target table.
  select array_agg(column_name order by array_position(clean_columns, column_name))
  into clean_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = clean_table
    and column_name = any(clean_columns);

  if array_length(clean_columns, 1) is null then
    raise exception 'None of the supplied columns exist in table %', clean_table;
  end if;

  select
    string_agg(format('%I', c), ', '),
    string_agg(format('%I text', c), ', '),
    string_agg(format('x.%I', c), ', ')
  into col_names, col_defs, select_names
  from unnest(clean_columns) as c;

  sql := format(
    'insert into public.%I (%s) select %s from jsonb_to_recordset($1) as x(%s)',
    clean_table,
    col_names,
    select_names,
    col_defs
  );

  execute sql using p_rows;
  get diagnostics inserted_count = row_count;

  return jsonb_build_object(
    'ok', true,
    'table', clean_table,
    'inserted', inserted_count,
    'columns', clean_columns
  );
end;
$$;

revoke all on function public.insert_results_upload_rows(text, jsonb, text[]) from public;
grant execute on function public.insert_results_upload_rows(text, jsonb, text[]) to service_role;
