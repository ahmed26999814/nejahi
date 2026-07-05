alter table public.bac_session2_results enable row level security;
alter table public.brevet_results enable row level security;
alter table public.concours_results enable row level security;
alter table public.excellence_1as_results enable row level security;

drop policy if exists "Allow anon read bac_session2_results" on public.bac_session2_results;
create policy "Allow anon read bac_session2_results"
on public.bac_session2_results
for select
to anon
using (true);

drop policy if exists "Allow anon read brevet_results" on public.brevet_results;
create policy "Allow anon read brevet_results"
on public.brevet_results
for select
to anon
using (true);

drop policy if exists "Allow anon read concours_results" on public.concours_results;
create policy "Allow anon read concours_results"
on public.concours_results
for select
to anon
using (true);

drop policy if exists "Allow anon read excellence_1as_results" on public.excellence_1as_results;
create policy "Allow anon read excellence_1as_results"
on public.excellence_1as_results
for select
to anon
using (true);
