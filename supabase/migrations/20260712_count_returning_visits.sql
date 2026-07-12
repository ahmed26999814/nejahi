create table if not exists public.site_visit_sessions (
  session_hash text primary key,
  visitor_hash text not null,
  started_at timestamptz not null default now()
);

create index if not exists site_visit_sessions_started_at_idx
  on public.site_visit_sessions(started_at desc);

alter table public.site_visit_sessions enable row level security;

create or replace function public.register_site_visit(
  p_visitor_hash text,
  p_session_hash text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  total bigint;
begin
  if coalesce(length(btrim(p_visitor_hash)), 0) < 32
     or coalesce(length(btrim(p_session_hash)), 0) < 32 then
    raise exception 'Invalid visitor or session identifier';
  end if;

  insert into public.site_visitors(visitor_hash)
  values (p_visitor_hash)
  on conflict (visitor_hash) do update
    set last_seen_at = now(),
        visit_count = public.site_visitors.visit_count + 1;

  insert into public.site_visit_sessions(session_hash, visitor_hash)
  values (p_session_hash, p_visitor_hash)
  on conflict (session_hash) do nothing;

  select count(*) into total from public.site_visit_sessions;
  return total;
end;
$$;

revoke all on table public.site_visit_sessions from anon, authenticated;
revoke all on function public.register_site_visit(text,text) from public;
grant execute on function public.register_site_visit(text,text) to service_role;
