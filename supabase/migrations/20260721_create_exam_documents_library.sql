create table if not exists public.exam_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  competition text not null,
  year integer,
  session text not null default 'عادية',
  branch text,
  subject text not null default 'مواد متعددة',
  document_type text not null check (
    document_type in ('exam', 'solution', 'reference', 'memo', 'bundle')
  ),
  title text not null,
  direct_url text,
  source_url text not null,
  link_text_hint text,
  source_name text not null default 'Rimbac',
  source_permission boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exam_documents_public_sort_idx
  on public.exam_documents (
    competition,
    year desc,
    branch,
    subject,
    sort_order,
    title
  )
  where is_active = true;

create index if not exists exam_documents_filter_idx
  on public.exam_documents (competition, year, branch, document_type)
  where is_active = true;

alter table public.exam_documents enable row level security;

revoke all on table public.exam_documents from anon, authenticated;
grant select on table public.exam_documents to anon, authenticated;

drop policy if exists "Public can read active exam documents"
  on public.exam_documents;

create policy "Public can read active exam documents"
  on public.exam_documents
  for select
  to anon, authenticated
  using (is_active = true);

comment on table public.exam_documents is
  'Authorized educational exam files indexed from Rimbac for MauriResults.';

comment on column public.exam_documents.direct_url is
  'Known direct file URL when available; otherwise the server-side resolver follows source_url.';

comment on column public.exam_documents.link_text_hint is
  'Optional anchor text used by the server-side download resolver.';
