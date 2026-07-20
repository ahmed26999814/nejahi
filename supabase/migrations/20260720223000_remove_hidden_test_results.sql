begin;

-- Remove the two hidden experimental result sources and all generated search/cache rows.
delete from public.result_number_lookup
where source_key in ('upload:bac_2026', 'upload:bepc_2022_test');

delete from public.published_exams
where source_key in ('upload:bac_2026', 'upload:bepc_2022_test')
   or table_name in ('bac_2026', 'bepc_2022_test');

-- The dashboard cache is removed automatically through ON DELETE CASCADE.
drop view if exists public.bepc_2022_test_ranked_results;
drop table if exists public.bac_2026;
drop table if exists public.bepc_2022_test;

commit;
