-- MauriResults stabilization indexes.
-- Safe to run repeatedly. No tables or production data are dropped.

create extension if not exists pg_trgm;

create index if not exists bac_results_numero_idx on public.bac_results ("Numero");
create index if not exists bac_results_nom_trgm_idx on public.bac_results using gin ("NOM" gin_trgm_ops);
create index if not exists bac_results_mod_idx on public.bac_results ("MOD" desc nulls last);

create index if not exists brevet_results_number_idx on public.brevet_results ("Num_Bepc");
create index if not exists brevet_results_name_trgm_idx on public.brevet_results using gin ("NOM" gin_trgm_ops);
create index if not exists brevet_results_score_idx on public.brevet_results ("Moyenne_Bepc" desc nulls last);

create index if not exists concours_results_number_idx on public.concours_results ("Numéro_C1AS");
create index if not exists concours_results_name_trgm_idx on public.concours_results using gin ("NOM_AR" gin_trgm_ops);
create index if not exists concours_results_location_number_idx
  on public.concours_results ("WILAYA_AR", "MOUGHATAA_AR", "Centre Examen_AR", "Numéro_C1AS");

create index if not exists bac_session2_results_number_idx on public.bac_session2_results ("NODOSS");
create index if not exists bac_session2_results_name_trgm_idx on public.bac_session2_results using gin ("NOM_AR" gin_trgm_ops);

create index if not exists excellence_1as_results_number_idx on public.excellence_1as_results ("Num_Excellence_1AS");
create index if not exists excellence_1as_results_name_trgm_idx on public.excellence_1as_results using gin ("Nom" gin_trgm_ops);

create index if not exists published_exams_active_year_created_idx
  on public.published_exams (is_active, year, created_at desc);

analyze public.bac_results;
analyze public.brevet_results;
analyze public.concours_results;
analyze public.bac_session2_results;
analyze public.excellence_1as_results;
analyze public.published_exams;

notify pgrst, 'reload schema';
