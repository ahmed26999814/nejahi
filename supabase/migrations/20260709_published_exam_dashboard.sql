-- MauriResults: analytics and toppers for exams published from /admin/results.
-- Run once in Supabase SQL Editor.

alter table public.published_exams
  add column if not exists search_mode text not null default 'simple';

create or replace function public.get_published_exam_dashboard(p_source_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  exam record;
  table_name text;
  ranked_name text;
  top_relation text;
  score_expr text;
  pass_expr text;
  stats jsonb := '{}'::jsonb;
  region_stats jsonb := '[]'::jsonb;
  school_stats jsonb := '[]'::jsonb;
  track_stats jsonb := '[]'::jsonb;
  moughataa_stats jsonb := '[]'::jsonb;
  top_students jsonb := '[]'::jsonb;
  track_expr text := '''''::text';
  decision_expr text := '''''::text';
  wilaya_expr text := '''''::text';
  school_expr text := '''''::text';
  centre_expr text := '''''::text';
  moughataa_expr text := '''''::text';
  rank_expr text := 'row_number() over ()';
  order_expr text;
begin
  select * into exam
  from public.published_exams
  where source_key = p_source_key and is_active = true
  limit 1;

  if not found then
    raise exception 'Published exam not found: %', p_source_key;
  end if;

  table_name := exam.table_name;
  ranked_name := coalesce(nullif(exam.ranked_view, ''), regexp_replace(table_name, '_results$', '') || '_ranked_results');

  if table_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then
    raise exception 'Invalid table name: %', table_name;
  end if;

  if to_regclass(format('public.%I', table_name)) is null then
    raise exception 'Table not found: %', table_name;
  end if;

  if to_regclass(format('public.%I', ranked_name)) is not null then
    top_relation := ranked_name;
  else
    top_relation := table_name;
  end if;

  score_expr := format('nullif(regexp_replace(replace(%I::text, '','', ''.''), ''[^0-9.]'', '''', ''g''), '''')::numeric', exam.score_column);
  pass_expr := format('coalesce(%s, 0) >= 10', score_expr);

  if coalesce(exam.decision_column, '') <> '' then
    pass_expr := format('(coalesce(%I::text, '''') ~* ''(admis|ناجح|ناجحة|مقبول|apte|pass|success|succès)'' or coalesce(%s, 0) >= 10)', exam.decision_column, score_expr);
    decision_expr := format('coalesce(%I::text, '''')', exam.decision_column);
  end if;

  if coalesce(exam.track_column, '') <> '' then track_expr := format('coalesce(%I::text, '''')', exam.track_column); end if;
  if coalesce(exam.wilaya_column, '') <> '' then wilaya_expr := format('coalesce(%I::text, '''')', exam.wilaya_column); end if;
  if coalesce(exam.school_column, '') <> '' then school_expr := format('coalesce(%I::text, '''')', exam.school_column); end if;
  if coalesce(exam.centre_column, '') <> '' then centre_expr := format('coalesce(%I::text, '''')', exam.centre_column); end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name=top_relation and column_name='rank') then
    rank_expr := 'rank';
    order_expr := 'rank asc nulls last';
  else
    order_expr := score_expr || ' desc nulls last';
  end if;

  execute format(
    'select jsonb_build_object(
      ''total'', count(*),
      ''passed'', count(*) filter (where %1$s),
      ''failed'', count(*) filter (where not (%1$s)),
      ''highest'', coalesce(max(%2$s), 0),
      ''average'', coalesce(avg(%2$s), 0),
      ''isConcours'', false
    ) from public.%3$I',
    pass_expr, score_expr, table_name
  ) into stats;

  if coalesce(exam.wilaya_column, '') <> '' then
    execute format(
      'select coalesce(jsonb_agg(jsonb_build_object(
        ''label'', label, ''wilaya'', label, ''total'', total, ''passed'', passed,
        ''highest'', highest, ''average'', average, ''passRate'', case when total > 0 then passed * 100.0 / total else 0 end
      )), ''[]''::jsonb) from (
        select coalesce(%1$I::text, ''غير محدد'') label, count(*) total, count(*) filter (where %2$s) passed,
        coalesce(max(%3$s), 0) highest, coalesce(avg(%3$s), 0) average
        from public.%4$I group by 1 order by count(*) desc limit 100
      ) x',
      exam.wilaya_column, pass_expr, score_expr, table_name
    ) into region_stats;
  end if;

  if coalesce(exam.school_column, '') <> '' then
    execute format(
      'select coalesce(jsonb_agg(jsonb_build_object(
        ''label'', label, ''school'', label, ''total'', total, ''passed'', passed,
        ''highest'', highest, ''average'', average, ''passRate'', case when total > 0 then passed * 100.0 / total else 0 end
      )), ''[]''::jsonb) from (
        select coalesce(%1$I::text, ''غير محدد'') label, count(*) total, count(*) filter (where %2$s) passed,
        coalesce(max(%3$s), 0) highest, coalesce(avg(%3$s), 0) average
        from public.%4$I group by 1 order by count(*) desc limit 100
      ) x',
      exam.school_column, pass_expr, score_expr, table_name
    ) into school_stats;
  end if;

  if coalesce(exam.track_column, '') <> '' then
    execute format(
      'select coalesce(jsonb_agg(jsonb_build_object(
        ''label'', label, ''track'', label, ''total'', total, ''passed'', passed,
        ''highest'', highest, ''average'', average, ''passRate'', case when total > 0 then passed * 100.0 / total else 0 end
      )), ''[]''::jsonb) from (
        select coalesce(%1$I::text, ''غير محدد'') label, count(*) total, count(*) filter (where %2$s) passed,
        coalesce(max(%3$s), 0) highest, coalesce(avg(%3$s), 0) average
        from public.%4$I group by 1 order by count(*) desc limit 100
      ) x',
      exam.track_column, pass_expr, score_expr, table_name
    ) into track_stats;
  end if;

  execute format(
    'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from (
      select
        %1$I::text as id,
        %2$I::text as name,
        %3$s as "MOD",
        %4$s as track,
        %5$s as kr,
        %6$s as wl,
        %7$s as ms,
        %8$s as centre,
        %9$s as moughataa,
        %10$s as rank,
        %11$L as source,
        %12$L as "sessionType"
      from public.%13$I
      order by %14$s
      limit 100
    ) t',
    exam.number_column,
    exam.name_column,
    score_expr,
    track_expr,
    decision_expr,
    wilaya_expr,
    school_expr,
    centre_expr,
    moughataa_expr,
    rank_expr,
    p_source_key,
    exam.title_ar,
    top_relation,
    order_expr
  ) into top_students;

  return jsonb_build_object(
    'stats', stats,
    'regionStats', region_stats,
    'schoolStats', school_stats,
    'trackStats', track_stats,
    'moughataaStats', moughataa_stats,
    'topStudents', top_students
  );
end;
$$;

revoke all on function public.get_published_exam_dashboard(text) from public;
grant execute on function public.get_published_exam_dashboard(text) to service_role;

grant select, insert, update, delete on public.published_exams to service_role;
notify pgrst, 'reload schema';
