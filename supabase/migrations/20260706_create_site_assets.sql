create table if not exists public.site_assets (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  image_url text,
  storage_path text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_site_assets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_assets_updated_at on public.site_assets;
create trigger set_site_assets_updated_at
before update on public.site_assets
for each row
execute function public.set_site_assets_updated_at();

alter table public.site_assets enable row level security;

drop policy if exists "site_assets_select_anon" on public.site_assets;
create policy "site_assets_select_anon"
on public.site_assets
for select
to anon
using (true);

drop policy if exists "site_assets_insert_anon" on public.site_assets;
create policy "site_assets_insert_anon"
on public.site_assets
for insert
to anon
with check (key in ('homepage_banner', 'result_page_banner'));

drop policy if exists "site_assets_update_anon" on public.site_assets;
create policy "site_assets_update_anon"
on public.site_assets
for update
to anon
using (key in ('homepage_banner', 'result_page_banner'))
with check (key in ('homepage_banner', 'result_page_banner'));

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "site_assets_storage_select_anon" on storage.objects;
create policy "site_assets_storage_select_anon"
on storage.objects
for select
to anon
using (bucket_id = 'site-assets');

drop policy if exists "site_assets_storage_insert_anon" on storage.objects;
create policy "site_assets_storage_insert_anon"
on storage.objects
for insert
to anon
with check (bucket_id = 'site-assets');

drop policy if exists "site_assets_storage_update_anon" on storage.objects;
create policy "site_assets_storage_update_anon"
on storage.objects
for update
to anon
using (bucket_id = 'site-assets')
with check (bucket_id = 'site-assets');

drop policy if exists "site_assets_storage_delete_anon" on storage.objects;
create policy "site_assets_storage_delete_anon"
on storage.objects
for delete
to anon
using (bucket_id = 'site-assets');
