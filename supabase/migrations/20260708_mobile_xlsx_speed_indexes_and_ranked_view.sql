-- MauriResults: keep future XLSX-uploaded exams fast.
-- Run this once in Supabase SQL Editor after the create_results_upload_table function.
-- It creates helpful indexes and a *_ranked_results view for a newly uploaded exam table.

create or replace function public.prepare_results_table_speed(
  p_table_name text,
  p_number_column text default null,
  p_name_column text default null,
  p_score_column text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_table text;
  ranked_view text;
  number_col text;
  name_col text;
  score_col text;
  sql text;
begin
  clean_table := trim(coalesce(p_table_name, ''));
  number_col := nullif(trim(coalesce(p_number_column, '')), '');
  name_col := nullif(trim(coalesce(p_name_column, '')), '');
  score_col := nullif(trim(coalesce(p_score_column, '')), '');

  if clean_table !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then
    raise exception 'Invalid table name: %', clean_table;
  end if;

  if to_regclass(format('public.%I', clean_table)) is null then
    raise exception 'Table does not exist: %', clean_table;
  end if;

  if number_col is not null then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = clean_table and column_name = number_col
    ) then
      raise exception 'Number column does not exist: %', number_col;
    end if;
    execute format(
      'create index if not exists %I on public.%I (%I)',
      'idx_' || clean_table || '_' || number_col,
      clean_table,
      number_col
    );
  end if;

  if name_col is not null then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = clean_table and column_name = name_col
    ) then
      raise exception 'Name column does not exist: %', name_col;
    end if;
    execute format(
      'create index if not exists %I on public.%I (%I)',
      'idx_' || clean_table || '_' || name_col,
      clean_table,
      name_col
    );
  end if;

  if score_col is not null then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = clean_table and column_name = score_col
    ) then
      raise exception 'Score column does not exist: %', score_col;
    end if;

    ranked_view := regexp_replace(clean_table, '_results$', '') || '_ranked_results';
    if ranked_view = clean_table then
      ranked_view := clean_table || '_ranked_results';
    end if;

    sql := format(
      'create or replace view public.%I as
       select *,
         row_number() over (
           order by
             case
               when replace(%I::text, '','', ''.'') ~ ''^[0-9]+(\.[0-9]+)?$''
                 then replace(%I::text, '','', ''.'')::numeric
               else null
             end desc nulls last
         ) as rank
       from public.%I',
      ranked_view,
      score_col,
      score_col,
      clean_table
    );

    execute sql;
    execute format('grant select on public.%I to anon, authenticated', ranked_view);
  else
    ranked_view := null;
  end if;

  execute format('analyze public.%I', clean_table);

  return jsonb_build_object(
    'ok', true,
    'table', clean_table,
    'rankedView', ranked_view,
    'numberColumn', number_col,
    'nameColumn', name_col,
    'scoreColumn', score_col
  );
end;
$$;

revoke all on function public.prepare_results_table_speed(text, text, text, text) from public;
grant execute on function public.prepare_results_table_speed(text, text, text, text) to service_role;
