-- MauriResults: fast ranked views for every current exam.
-- Future exam tables should follow the same idea:
-- 1) create a *_ranked_results view
-- 2) include the same original columns used by the UI
-- 3) add rank using row_number() over(order by score desc)
-- 4) grant select to anon and authenticated

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

create or replace view public.brevet_ranked_results as
select
  "Num_Bepc",
  "NOM",
  "Moyenne_Bepc",
  "Decision",
  "Ecole",
  "Centre",
  "WILAYA",
  "LIEU_NAIS",
  "DATE_NAISS",
  row_number() over (
    order by
      case
        when replace("Moyenne_Bepc"::text, ',', '.') ~ '^[0-9]+(\.[0-9]+)?$'
          then replace("Moyenne_Bepc"::text, ',', '.')::numeric
        else null
      end desc nulls last,
      "Num_Bepc"
  ) as rank
from public.brevet_results;

create or replace view public.concours_ranked_results as
select
  *,
  row_number() over (
    order by
      case
        when replace(coalesce("total_num"::text, "TOTAL"::text), ',', '.') ~ '^[0-9]+(\.[0-9]+)?$'
          then replace(coalesce("total_num"::text, "TOTAL"::text), ',', '.')::numeric
        else null
      end desc nulls last,
      "Numéro_C1AS"
  ) as rank
from public.concours_results_view;

create or replace view public.bac_session2_ranked_results as
select
  "NODOSS",
  "NOM_AR",
  "NOM_FR",
  "SERIE",
  "Moy Bac_Session",
  "Decision",
  "Wilaya_AR",
  "Wilaya_FR",
  "Etablissement_AR",
  "Etablissement_FR",
  "Centre Examen_AR",
  "Centre Examen_FR",
  "LIEUNN_AR",
  "LIEUN_FR",
  "DATN",
  row_number() over (
    order by
      case
        when replace("Moy Bac_Session"::text, ',', '.') ~ '^[0-9]+(\.[0-9]+)?$'
          then replace("Moy Bac_Session"::text, ',', '.')::numeric
        else null
      end desc nulls last,
      "NODOSS"
  ) as rank
from public.bac_session2_results;

create or replace view public.excellence_1as_ranked_results as
select
  "Num_Excellence_1AS",
  "Nom",
  "SERIE",
  "Mgex",
  "Decision",
  "Wilaya_AR",
  "CENTRE_AR",
  "Lieu",
  "DATEN",
  "Matricule",
  "ARABE",
  "FRANCAIS",
  "CALCUL",
  row_number() over (
    order by
      case
        when replace("Mgex"::text, ',', '.') ~ '^[0-9]+(\.[0-9]+)?$'
          then replace("Mgex"::text, ',', '.')::numeric
        else null
      end desc nulls last,
      "Num_Excellence_1AS"
  ) as rank
from public.excellence_1as_results;

grant select on public.bac_ranked_results to anon;
grant select on public.brevet_ranked_results to anon;
grant select on public.concours_ranked_results to anon;
grant select on public.bac_session2_ranked_results to anon;
grant select on public.excellence_1as_ranked_results to anon;

grant select on public.bac_ranked_results to authenticated;
grant select on public.brevet_ranked_results to authenticated;
grant select on public.concours_ranked_results to authenticated;
grant select on public.bac_session2_ranked_results to authenticated;
grant select on public.excellence_1as_ranked_results to authenticated;

analyze public.bac_results;
analyze public.brevet_results;
analyze public.concours_results;
analyze public.bac_session2_results;
analyze public.excellence_1as_results;
