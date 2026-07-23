create or replace function public.get_exam_average_frequency(
  p_source_key text,
  p_include_inactive boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
set statement_timeout to '60s'
as $function$
declare
  exam public.published_exams%rowtype;
  score_expr text;
  pass_expr text;
  result jsonb;
begin
  if p_source_key <> 'upload:results_bac_2026' then
    raise exception 'Average frequency is only available for Bac 2026';
  end if;

  select *
  into exam
  from public.published_exams
  where source_key = p_source_key
    and (is_active or p_include_inactive)
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'Published exam not found: %', p_source_key;
  end if;

  if exam.table_name !~ '^[A-Za-z_][A-Za-z0-9_]{1,62}$' then
    raise exception 'Invalid table name';
  end if;

  if to_regclass(format('public.%I', exam.table_name)) is null then
    raise exception 'Results table not found';
  end if;

  score_expr := format(
    'nullif(regexp_replace(replace(%I::text, '','', ''.''), ''[^0-9.-]'', '''', ''g''), '''')::numeric',
    exam.score_column
  );
  pass_expr := format('coalesce(%s, 0) >= 10', score_expr);

  if coalesce(exam.decision_column, '') <> '' then
    pass_expr := format(
      '(coalesce(%I::text, '''') ~* ''(admis|ناجح|ناجحة|مقبول|apte|pass|success|succès)'' or coalesce(%s, 0) >= 10)',
      exam.decision_column,
      score_expr
    );
  end if;

  execute format(
    'select coalesce(
       jsonb_agg(
         jsonb_build_object(''average'', x.average, ''occurrences'', x.occurrences)
         order by x.average desc
       ),
       ''[]''::jsonb
     )
     from (
       select round(%1$s, 2) as average, count(*)::bigint as occurrences
       from public.%2$I
       where (%3$s) and %1$s is not null
       group by round(%1$s, 2)
     ) x',
    score_expr,
    exam.table_name,
    pass_expr
  ) into result;

  return coalesce(result, '[]'::jsonb);
end;
$function$;

revoke all on function public.get_exam_average_frequency(text, boolean) from public;
revoke all on function public.get_exam_average_frequency(text, boolean) from anon;
revoke all on function public.get_exam_average_frequency(text, boolean) from authenticated;
grant execute on function public.get_exam_average_frequency(text, boolean) to service_role;
