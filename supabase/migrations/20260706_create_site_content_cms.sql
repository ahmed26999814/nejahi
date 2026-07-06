create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  content_key text not null unique,
  title text,
  value text,
  type text not null default 'text',
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_site_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_content_updated_at on public.site_content;
create trigger set_site_content_updated_at
before update on public.site_content
for each row
execute function public.set_site_content_updated_at();

alter table public.site_content enable row level security;

drop policy if exists "site_content_select_anon" on public.site_content;
create policy "site_content_select_anon"
on public.site_content
for select
to anon
using (true);

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

drop policy if exists "site_images_select_anon" on storage.objects;
create policy "site_images_select_anon"
on storage.objects
for select
to anon
using (bucket_id = 'site-images');

insert into public.site_content (content_key, title, value, type)
values
  ('developer_name', 'Developer Name', 'Ahmed abdellahi mady', 'text'),
  ('developer_job_title', 'Job Title', 'مطور الموقع', 'text'),
  ('developer_description', 'Description', 'تم تطوير MauriResults لتقديم تجربة سريعة وواضحة لعرض نتائج المسابقات الوطنية في موريتانيا.', 'textarea'),
  ('developer_whatsapp', 'WhatsApp Link', 'https://wa.me/22244881891', 'url'),
  ('developer_facebook', 'Facebook Link', 'https://www.facebook.com/ahmed.abde.mady', 'url')
on conflict (content_key) do nothing;
