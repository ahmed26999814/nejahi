-- MauriResults performance indexes for fast search and ranking pages.
-- Run this in Supabase SQL Editor if migrations are not applied automatically.

-- BAC search and ranking filters
create index if not exists idx_bac_results_numero_fast
on public.bac_results ("Numero");

create index if not exists idx_bac_results_wl_fast
on public.bac_results ("WL");

create index if not exists idx_bac_results_md_fast
on public.bac_results ("MD");

create index if not exists idx_bac_results_ms_fast
on public.bac_results ("MS");

create index if not exists idx_bac_results_ts_fast
on public.bac_results ("TS");

create index if not exists idx_bac_results_mod_fast
on public.bac_results ("MOD");

-- BEPC/Brevet search and ranking filters
create index if not exists idx_brevet_results_num_fast
on public.brevet_results ("Num_Bepc");

create index if not exists idx_brevet_results_wilaya_fast
on public.brevet_results ("WILAYA");

create index if not exists idx_brevet_results_ecole_fast
on public.brevet_results ("Ecole");

create index if not exists idx_brevet_results_centre_fast
on public.brevet_results ("Centre");

create index if not exists idx_brevet_results_moyenne_fast
on public.brevet_results ("Moyenne_Bepc");

-- Concours search and guided ranking filters
create index if not exists idx_concours_results_nodoss_fast
on public.concours_results ("NODOSS");

create index if not exists idx_concours_results_numero_c1as_fast
on public.concours_results ("Numéro_C1AS");

create index if not exists idx_concours_results_wilaya_fast
on public.concours_results ("WILAYA_AR");

create index if not exists idx_concours_results_moughataa_fast
on public.concours_results ("MOUGHATAA_AR");

create index if not exists idx_concours_results_centre_fast
on public.concours_results ("Centre Examen_AR");

create index if not exists idx_concours_results_ecole_fast
on public.concours_results ("Ecole_AR");

create index if not exists idx_concours_results_type_fast
on public.concours_results ("TYPE");

-- Bac complementary session search and ranking filters
create index if not exists idx_bac_session2_results_nodoss_fast
on public.bac_session2_results ("NODOSS");

create index if not exists idx_bac_session2_results_wilaya_fast
on public.bac_session2_results ("Wilaya_AR");

create index if not exists idx_bac_session2_results_etab_fast
on public.bac_session2_results ("Etablissement_AR");

create index if not exists idx_bac_session2_results_centre_fast
on public.bac_session2_results ("Centre Examen_AR");

create index if not exists idx_bac_session2_results_serie_fast
on public.bac_session2_results ("SERIE");

-- Excellence 1AS search and ranking filters
create index if not exists idx_excellence_1as_results_num_fast
on public.excellence_1as_results ("Num_Excellence_1AS");

create index if not exists idx_excellence_1as_results_wilaya_fast
on public.excellence_1as_results ("Wilaya_AR");

create index if not exists idx_excellence_1as_results_centre_fast
on public.excellence_1as_results ("CENTRE_AR");

create index if not exists idx_excellence_1as_results_serie_fast
on public.excellence_1as_results ("SERIE");

-- Refresh planner statistics after adding indexes
analyze public.bac_results;
analyze public.brevet_results;
analyze public.concours_results;
analyze public.bac_session2_results;
analyze public.excellence_1as_results;
