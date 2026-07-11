-- Prevent duplicate rows when an upload is retried.
-- The first upload chunk calls create_results_upload_table; this version
-- creates the table when missing and truncates it when it already exists.

begin;

drop function if exists public.create_results_upload_table(text, text[]);

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
  v_exists boolean;
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

  select to_regclass(format('public.%I', p_table_name)) is not null into v_exists;

  if v_exists then
    execute format('truncate table public.%I', p_table_name);
  else
    execute format('create table public.%I (%s)', p_table_name, v_defs);
  end if;

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
    'columns', v_safe_columns,
    'reset_existing', v_exists
  );
end;
$$;

revoke all on function public.create_results_upload_table(text, text[]) from public;
grant execute on function public.create_results_upload_table(text, text[]) to service_role;

commit;
