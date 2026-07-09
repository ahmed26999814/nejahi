-- MauriResults: publish XLSX-uploaded exams to the public website without code changes.
-- Run once in Supabase SQL Editor after the XLSX upload helper functions.

create table if not exists public.published_exams (
  id bigserial primary key,
  table_name text not null unique,
  source_key text not null unique,
  title_ar text not null,
  title_fr text,
  description_ar text,
  description_fr text,
  year text default '2026',
  tone text default 'green',
  number_column text not null,
  name_column text not null,
  score_column text not null,
  decision_column text,
  track_column text,
  wilaya_column text,
  school_column text,
  centre_column text,
  birth_place_column text,
  birth_date_column text,
  ranked_view text,
  total_rows integer default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.published_exams enable row level security;

drop policy if exists "Published exams are publicly readable" on public.published_exams;
create policy "Published exams are publicly readable"
  on public.published_exams
  for select
  to anon, authenticated
  using (is_active = true);

grant select on public.published_exams to anon, authenticated;
grant select, insert, update, delete on public.published_exams to service_role;
grant usage, select on sequence public.published_exams_id_seq to service_role;

create or replace function public.touch_published_exams_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_published_exams_updated_at on public.published_exams;
create trigger trg_touch_published_exams_updated_at
before update on public.published_exams
for each row
execute function public.touch_published_exams_updated_at();

notify pgrst, 'reload schema';
