-- MauriResults: ranked BAC view used by /api/search.
-- This keeps the client from loading all BAC rows just to calculate ranks.

create or replace view public.bac_ranked_results as
select
  "Numero",
  "NOM",
  "TS",
  "MOD",
  "KR",
  "WL",
  "MS",
  "MD",
  row_number() over (
    order by
      case
        when replace("MOD"::text, ',', '.') ~ '^[0-9]+(\.[0-9]+)?$'
          then replace("MOD"::text, ',', '.')::numeric
        else null
      end desc nulls last,
      "Numero"
  ) as rank
from public.bac_results;

grant select on public.bac_ranked_results to anon;
grant select on public.bac_ranked_results to authenticated;

-- Helpful indexes for the underlying table.
create index if not exists idx_bac_results_numero_for_ranked_view
on public.bac_results ("Numero");

create index if not exists idx_bac_results_nom_for_ranked_view
on public.bac_results ("NOM");

analyze public.bac_results;
