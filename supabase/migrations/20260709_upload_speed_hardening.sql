-- MauriResults speed hardening for phone XLSX uploads.
-- Run this once after published_exams.sql and the XLSX upload SQL functions.

create extension if not exists pg_trgm;

alter table public.published_exams
  add column if not exists search_mode text not null default 'simple',
  add column if not exists moughataa_column text;

create index if not exists idx_published_exams_active_year
  on public.published_exams (is_active, year, created_at desc);

create index if not exists idx_published_exams_source_key
  on public.published_exams (source_key);

create or replace function public.prepare_results_table_speed(
  p_table_name text,
  p_number_column text default null,
  p_name_column text default null,
  p_score_column text default null,
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
  ranked_view text;
  score_expr text;
  has_table regclass;
begin
  if p_table_name is null or p_table_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then
    raise exception 'Invalid table name: %', p_table_name;
  end if;

  has_table := to_regclass(format('public.%I', p_table_name));
  if has_table is null then
    raise exception 'Table not found: %', p_table_name;
  end if;

  if coalesce(p_number_column, '') <> '' then
    execute format('create index if not exists %I on public.%I ((%I::text))',
      'idx_' || p_table_name || '_candidate_number', p_table_name, p_number_column);
  end if;

  if coalesce(p_name_column, '') <> '' then
    execute format('create index if not exists %I on public.%I using gin (lower(%I::text) gin_trgm_ops)',
      'idx_' || p_table_name || '_name_trgm', p_table_name, p_name_column);
  end if;

  if coalesce(p_score_column, '') <> '' then
    score_expr := format('nullif(regexp_replace(replace(%I::text, '','', ''.''), ''[^0-9.]'', '''', ''g''), '''')::numeric', p_score_column);
    execute format('create index if not exists %I on public.%I ((%s) desc nulls last)',
      'idx_' || p_table_name || '_score_num', p_table_name, score_expr);
  else
    score_expr := '0::numeric';
  end if;

  if coalesce(p_wilaya_column, '') <> '' then
    execute format('create index if not exists %I on public.%I ((%I::text))',
      'idx_' || p_table_name || '_wilaya', p_table_name, p_wilaya_column);
  end if;

  if coalesce(p_moughataa_column, '') <> '' then
    execute format('create index if not exists %I on public.%I ((%I::text))',
      'idx_' || p_table_name || '_moughataa', p_table_name, p_moughataa_column);
  end if;

  if coalesce(p_centre_column, '') <> '' then
    execute format('create index if not exists %I on public.%I ((%I::text))',
      'idx_' || p_table_name || '_centre', p_table_name, p_centre_column);
  end if;

  if coalesce(p_wilaya_column, '') <> '' and coalesce(p_moughataa_column, '') <> '' and coalesce(p_centre_column, '') <> '' and coalesce(p_number_column, '') <> '' then
    execute format('create index if not exists %I on public.%I ((%I::text), (%I::text), (%I::text), (%I::text))',
      'idx_' || p_table_name || '_concours_path', p_table_name, p_wilaya_column, p_moughataa_column, p_centre_column, p_number_column);
  end if;

  ranked_view := regexp_replace(p_table_name, '_results$', '') || '_ranked_results';

  execute format('drop view if exists public.%I cascade', ranked_view);
  execute format(
    'create view public.%I as
     select t.*, dense_rank() over (order by %s desc nulls last) as rank
     from public.%I t',
    ranked_view, score_expr, p_table_name
  );

  execute format('grant select on public.%I to anon, authenticated, service_role', ranked_view);
  execute format('analyze public.%I', p_table_name);
  notify pgrst, 'reload schema';

  return jsonb_build_object(
    'ok', true,
    'table', p_table_name,
    'ranked_view', ranked_view,
    'indexes', jsonb_build_array('number', 'name_trgm', 'score', 'location_optional')
  );
end;
$$;

revoke all on function public.prepare_results_table_speed(text, text, text, text, text, text, text) from public;
grant execute on function public.prepare_results_table_speed(text, text, text, text, text, text, text) to service_role;

notify pgrst, 'reload schema';
