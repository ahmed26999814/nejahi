create or replace function public.search_uploaded_exam_rows(
  p_source_key text,
  p_query text,
  p_wilaya text default null,
  p_moughataa text default null,
  p_centre text default null
)
returns setof jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.published_exams%rowtype;
  sql_text text;
  q text := btrim(coalesce(p_query, ''));
  numeric_variants text[];
  numeric_value text;
begin
  select * into e from public.published_exams
  where source_key = p_source_key and is_active = true limit 1;
  if not found then raise exception 'Active uploaded exam not found'; end if;
  if q = '' then return; end if;

  if q ~ '^[0-9]+$' then
    numeric_value := (q::numeric)::text;
    numeric_variants := array[q,numeric_value,lpad(numeric_value,3,'0'),lpad(numeric_value,4,'0'),lpad(numeric_value,5,'0'),lpad(numeric_value,6,'0'),lpad(numeric_value,7,'0'),lpad(numeric_value,8,'0')];
    sql_text := format('select to_jsonb(t) from public.%I t where btrim(t.%I::text) = any($1)', e.table_name, e.number_column);
  else
    numeric_variants := null;
    sql_text := format('select to_jsonb(t) from public.%I t where t.%I::text ilike $2', e.table_name, e.name_column);
  end if;

  if e.search_mode = 'concours' then
    if coalesce(btrim(p_wilaya),'') = '' or coalesce(btrim(p_moughataa),'') = '' or coalesce(btrim(p_centre),'') = '' then
      raise exception 'Location fields are required for concours search';
    end if;
    sql_text := sql_text || format(' and btrim(t.%I::text) = btrim($3) and btrim(t.%I::text) = btrim($4) and btrim(t.%I::text) = btrim($5)', e.wilaya_column, e.moughataa_column, e.centre_column);
  end if;

  sql_text := sql_text || ' limit 20';
  if q ~ '^[0-9]+$' then
    return query execute sql_text using numeric_variants, null::text, p_wilaya, p_moughataa, p_centre;
  else
    return query execute sql_text using null::text[], '%' || q || '%', p_wilaya, p_moughataa, p_centre;
  end if;
end;
$$;

create or replace function public.get_uploaded_exam_location_options(
  p_source_key text,
  p_level text,
  p_wilaya text default null,
  p_moughataa text default null
)
returns table(value text)
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.published_exams%rowtype;
  target_column text;
  sql_text text;
begin
  select * into e from public.published_exams
  where source_key = p_source_key and is_active = true and search_mode = 'concours' limit 1;
  if not found then raise exception 'Active uploaded concours not found'; end if;

  target_column := case p_level when 'wilaya' then e.wilaya_column when 'moughataa' then e.moughataa_column when 'centre' then e.centre_column else null end;
  if coalesce(target_column,'') = '' then raise exception 'Invalid or unmapped location level'; end if;

  sql_text := format('select distinct btrim(t.%I::text) as value from public.%I t where nullif(btrim(t.%I::text), '''') is not null', target_column, e.table_name, target_column);
  if p_level in ('moughataa','centre') then sql_text := sql_text || format(' and btrim(t.%I::text) = btrim($1)', e.wilaya_column); end if;
  if p_level = 'centre' then sql_text := sql_text || format(' and btrim(t.%I::text) = btrim($2)', e.moughataa_column); end if;
  sql_text := sql_text || ' order by 1';
  return query execute sql_text using p_wilaya, p_moughataa;
end;
$$;

revoke all on function public.search_uploaded_exam_rows(text,text,text,text,text) from public;
revoke all on function public.get_uploaded_exam_location_options(text,text,text,text) from public;
grant execute on function public.search_uploaded_exam_rows(text,text,text,text,text) to anon, authenticated, service_role;
grant execute on function public.get_uploaded_exam_location_options(text,text,text,text) to anon, authenticated, service_role;
