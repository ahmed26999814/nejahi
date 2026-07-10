-- Uploaded-results final stabilization.
-- Adds complete moughataa analytics, preserves database dense ranks, and permits
-- server-side validation of an inactive exam before it is publicly activated.

alter table public.published_exams
  add column if not exists search_mode text not null default 'simple',
  add column if not exists moughataa_column text;

drop function if exists public.get_published_exam_dashboard(text);

create or replace function public.get_published_exam_dashboard(
  p_source_key text,
  p_include_inactive boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  exam public.published_exams%rowtype;
  relation_name text;
  score_expr text;
  pass_expr text;
  rank_expr text := 'row_number() over (order by 1)';
  order_expr text;
  track_expr text := $sql$''::text$sql$;
  decision_expr text := $sql$''::text$sql$;
  wilaya_expr text := $sql$''::text$sql$;
  moughataa_expr text := $sql$''::text$sql$;
  school_expr text := $sql$''::text$sql$;
  centre_expr text := $sql$''::text$sql$;
  birth_place_expr text := $sql$''::text$sql$;
  birth_date_expr text := $sql$''::text$sql$;
  stats jsonb;
  region_stats jsonb := '[]'::jsonb;
  moughataa_stats jsonb := '[]'::jsonb;
  school_stats jsonb := '[]'::jsonb;
  track_stats jsonb := '[]'::jsonb;
  top_students jsonb := '[]'::jsonb;
begin
  select * into exam from public.published_exams
  where source_key = p_source_key and (is_active or p_include_inactive)
  order by created_at desc limit 1;
  if not found then raise exception 'Published exam not found: %', p_source_key; end if;
  if exam.table_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then raise exception 'Invalid table name'; end if;
  if to_regclass(format('public.%I', exam.table_name)) is null then raise exception 'Results table not found'; end if;

  relation_name := coalesce(nullif(exam.ranked_view, ''), regexp_replace(exam.table_name, '_results$', '') || '_ranked_results');
  if to_regclass(format('public.%I', relation_name)) is null then raise exception 'Ranked view not found: %', relation_name; end if;

  score_expr := format('nullif(regexp_replace(replace(%I::text, '','', ''.''), ''[^0-9.-]'', '''', ''g''), '''')::numeric', exam.score_column);
  pass_expr := format('coalesce(%s, 0) >= 10', score_expr);
  if coalesce(exam.decision_column, '') <> '' then
    decision_expr := format('coalesce(%I::text, '''')', exam.decision_column);
    pass_expr := format('(coalesce(%I::text, '''') ~* ''(admis|ناجح|ناجحة|مقبول|apte|pass|success|succès)'' or coalesce(%s, 0) >= 10)', exam.decision_column, score_expr);
  end if;
  if coalesce(exam.track_column, '') <> '' then track_expr := format('coalesce(%I::text, '''')', exam.track_column); end if;
  if coalesce(exam.wilaya_column, '') <> '' then wilaya_expr := format('coalesce(%I::text, '''')', exam.wilaya_column); end if;
  if coalesce(exam.moughataa_column, '') <> '' then moughataa_expr := format('coalesce(%I::text, '''')', exam.moughataa_column); end if;
  if coalesce(exam.school_column, '') <> '' then school_expr := format('coalesce(%I::text, '''')', exam.school_column); end if;
  if coalesce(exam.centre_column, '') <> '' then centre_expr := format('coalesce(%I::text, '''')', exam.centre_column); end if;
  if coalesce(exam.birth_place_column, '') <> '' then birth_place_expr := format('coalesce(%I::text, '''')', exam.birth_place_column); end if;
  if coalesce(exam.birth_date_column, '') <> '' then birth_date_expr := format('coalesce(%I::text, '''')', exam.birth_date_column); end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name=relation_name and column_name='rank') then
    rank_expr := 'rank'; order_expr := 'rank asc nulls last';
  else raise exception 'Ranked view has no rank column: %', relation_name;
  end if;

  execute format('select jsonb_build_object(''total'',count(*),''passed'',count(*) filter(where %1$s),''failed'',count(*) filter(where not (%1$s)),''highest'',coalesce(max(%2$s),0),''average'',coalesce(avg(%2$s),0),''isConcours'',%3$s) from public.%4$I', pass_expr, score_expr, case when exam.search_mode = 'concours' then 'true' else 'false' end, exam.table_name) into stats;

  if coalesce(exam.wilaya_column, '') <> '' then
    execute format('select coalesce(jsonb_agg(to_jsonb(x)),''[]''::jsonb) from (select coalesce(%1$I::text,''غير محدد'') label,coalesce(%1$I::text,''غير محدد'') wilaya,count(*) total,count(*) filter(where %2$s) passed,coalesce(max(%3$s),0) highest,coalesce(avg(%3$s),0) average,(count(*) filter(where %2$s))*100.0/nullif(count(*),0) "passRate" from public.%4$I group by 1 order by count(*) desc limit 100)x', exam.wilaya_column, pass_expr, score_expr, exam.table_name) into region_stats;
  end if;
  if coalesce(exam.moughataa_column, '') <> '' then
    execute format('select coalesce(jsonb_agg(to_jsonb(x)),''[]''::jsonb) from (select coalesce(%1$I::text,''غير محدد'') label,coalesce(%1$I::text,''غير محدد'') moughataa,count(*) total,count(*) filter(where %2$s) passed,coalesce(max(%3$s),0) highest,coalesce(avg(%3$s),0) average,(count(*) filter(where %2$s))*100.0/nullif(count(*),0) "passRate" from public.%4$I group by 1 order by count(*) desc limit 100)x', exam.moughataa_column, pass_expr, score_expr, exam.table_name) into moughataa_stats;
  end if;
  if coalesce(exam.school_column, '') <> '' then
    execute format('select coalesce(jsonb_agg(to_jsonb(x)),''[]''::jsonb) from (select coalesce(%1$I::text,''غير محدد'') label,coalesce(%1$I::text,''غير محدد'') school,count(*) total,count(*) filter(where %2$s) passed,coalesce(max(%3$s),0) highest,coalesce(avg(%3$s),0) average,(count(*) filter(where %2$s))*100.0/nullif(count(*),0) "passRate" from public.%4$I group by 1 order by count(*) desc limit 100)x', exam.school_column, pass_expr, score_expr, exam.table_name) into school_stats;
  end if;
  if coalesce(exam.track_column, '') <> '' then
    execute format('select coalesce(jsonb_agg(to_jsonb(x)),''[]''::jsonb) from (select coalesce(%1$I::text,''غير محدد'') label,coalesce(%1$I::text,''غير محدد'') track,count(*) total,count(*) filter(where %2$s) passed,coalesce(max(%3$s),0) highest,coalesce(avg(%3$s),0) average,(count(*) filter(where %2$s))*100.0/nullif(count(*),0) "passRate" from public.%4$I group by 1 order by count(*) desc limit 100)x', exam.track_column, pass_expr, score_expr, exam.table_name) into track_stats;
  end if;

  execute format('select coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb) from (select %1$I::text id,%2$I::text name,%3$s "MOD",%4$s track,%5$s kr,%6$s wl,%7$s moughataa,%8$s ms,%9$s centre,%10$s "birthPlace",%11$s "birthDate",%12$s rank,%13$L source,%14$L "sessionType",%15$L "searchMode" from public.%16$I order by %17$s limit 100)t', exam.number_column, exam.name_column, score_expr, track_expr, decision_expr, wilaya_expr, moughataa_expr, school_expr, centre_expr, birth_place_expr, birth_date_expr, rank_expr, p_source_key, exam.title_ar, exam.search_mode, relation_name, order_expr) into top_students;

  return jsonb_build_object('stats',stats,'regionStats',region_stats,'moughataaStats',moughataa_stats,'schoolStats',school_stats,'trackStats',track_stats,'topStudents',top_students);
end;
$$;

revoke all on function public.get_published_exam_dashboard(text, boolean) from public;
grant execute on function public.get_published_exam_dashboard(text, boolean) to service_role;

create index if not exists idx_published_exams_active_year_created
  on public.published_exams (is_active, year, created_at desc);

notify pgrst, 'reload schema';
