-- Route public candidature lookups through the Next.js server only. The server
-- uses service_role while anon/authenticated roles remain blocked from tables
-- and RPCs. Add a direct FK index for maintenance/cascade performance.

create index if not exists competition_candidatures_track_id_idx
  on public.competition_candidatures (track_id);

revoke execute on function public.get_public_competition_catalog() from anon, authenticated;
revoke execute on function public.search_public_competition_candidatures(text, text, text, text, integer) from anon, authenticated;
grant execute on function public.get_public_competition_catalog() to service_role;
grant execute on function public.search_public_competition_candidatures(text, text, text, text, integer) to service_role;

drop policy if exists competitions_no_public_direct_access on public.competitions;
create policy competitions_no_public_direct_access
  on public.competitions for all to anon, authenticated
  using (false) with check (false);

drop policy if exists competition_tracks_no_public_direct_access on public.competition_tracks;
create policy competition_tracks_no_public_direct_access
  on public.competition_tracks for all to anon, authenticated
  using (false) with check (false);

drop policy if exists competition_candidatures_no_public_direct_access on public.competition_candidatures;
create policy competition_candidatures_no_public_direct_access
  on public.competition_candidatures for all to anon, authenticated
  using (false) with check (false);

notify pgrst, 'reload schema';
