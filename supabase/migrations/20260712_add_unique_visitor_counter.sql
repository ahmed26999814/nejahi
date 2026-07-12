create table if not exists public.site_visitors (
  visitor_hash text primary key,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  visit_count bigint not null default 1 check (visit_count > 0)
);

alter table public.site_visitors enable row level security;

create or replace function public.register_site_visitor(p_visitor_hash text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  total bigint;
begin
  if coalesce(length(btrim(p_visitor_hash)), 0) < 32 then
    raise exception 'Invalid visitor identifier';
  end if;

  insert into public.site_visitors(visitor_hash)
  values (p_visitor_hash)
  on conflict (visitor_hash) do update
    set last_seen_at = now(),
        visit_count = public.site_visitors.visit_count + 1;

  select count(*) into total from public.site_visitors;
  return total;
end;
$$;

revoke all on table public.site_visitors from anon, authenticated;
revoke all on function public.register_site_visitor(text) from public;
grant execute on function public.register_site_visitor(text) to service_role;
