create or replace view public.concours_results_view as
select
  concours_results.*,
  case
    when nullif(replace("TOTAL", ',', '.'), '') ~ '^[0-9]+(\.[0-9]+)?$'
      then nullif(replace("TOTAL", ',', '.'), '')::numeric
    else null
  end as total_num
from public.concours_results;

grant select on public.concours_results_view to anon;
grant select on public.concours_results_view to authenticated;
