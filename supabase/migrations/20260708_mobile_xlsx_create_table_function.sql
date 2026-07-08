-- MauriResults: allow the server-side admin XLSX upload route to create
-- a new results table automatically for a future exam.
-- Run this once in Supabase SQL Editor.

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
  clean_table text;
  col text;
  clean_columns text[] := array[]::text[];
  sql text;
begin
  clean_table := trim(coalesce(p_table_name, ''));

  if clean_table !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then
    raise exception 'Invalid table name: %', clean_table;
  end if;

  if p_columns is null or array_length(p_columns, 1) is null then
    raise exception 'No columns supplied';
  end if;

  foreach col in array p_columns loop
    col := trim(coalesce(col, ''));
    if col = '' then
      continue;
    end if;
    if col in ('id', 'created_at', 'updated_at') then
      col := 'result_' || col;
    end if;
    if not (col = any(clean_columns)) then
      clean_columns := clean_columns || col;
    end if;
  end loop;

  if array_length(clean_columns, 1) is null then
    raise exception 'No valid columns supplied';
  end if;

  sql := format(
    'create table if not exists public.%I (id bigserial primary key, created_at timestamptz not null default now(), upload_source text)',
    clean_table
  );
  execute sql;

  foreach col in array clean_columns loop
    execute format('alter table public.%I add column if not exists %I text', clean_table, col);
  end loop;

  execute format('alter table public.%I enable row level security', clean_table);
  execute format('grant select on public.%I to anon, authenticated', clean_table);
  execute format('grant insert, update, delete, select on public.%I to service_role', clean_table);

  -- Force Supabase/PostgREST to see the newly created table immediately.
  perform pg_notify('pgrst', 'reload schema');

  return jsonb_build_object(
    'ok', true,
    'table', clean_table,
    'columns', clean_columns,
    'schemaReloadRequested', true
  );
end;
$$;

revoke all on function public.create_results_upload_table(text, text[]) from public;
grant execute on function public.create_results_upload_table(text, text[]) to service_role;
