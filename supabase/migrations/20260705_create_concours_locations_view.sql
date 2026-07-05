create or replace view public.concours_locations_view as
select distinct
  "WILAYA_AR",
  "MOUGHATAA_AR",
  "Centre Examen_AR"
from public.concours_results
where nullif("WILAYA_AR", '') is not null
  and nullif("MOUGHATAA_AR", '') is not null
  and nullif("Centre Examen_AR", '') is not null;

grant select on public.concours_locations_view to anon;
grant select on public.concours_locations_view to authenticated;
