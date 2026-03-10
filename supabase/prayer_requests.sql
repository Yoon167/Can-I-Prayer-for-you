create extension if not exists pgcrypto;

create table if not exists public.prayer_requests (
  id text primary key default gen_random_uuid()::text,
  label text not null,
  completed boolean not null default false,
  answered_at text,
  answered_note text not null default '',
  requested_by text not null,
  is_anonymous boolean not null default false,
  workflow_status text not null default 'queue',
  category text not null default 'Community care',
  confidentiality text not null default 'Intercessor safe',
  submitted_by text not null default 'Prayer app',
  assigned_to text not null default 'Open team',
  flagged_at text,
  prayed_at text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.prayer_requests
  add column if not exists completed boolean not null default false,
  add column if not exists answered_at text,
  add column if not exists answered_note text not null default '',
  add column if not exists requested_by text not null default 'Community member',
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists workflow_status text not null default 'queue',
  add column if not exists category text not null default 'Community care',
  add column if not exists confidentiality text not null default 'Intercessor safe',
  add column if not exists submitted_by text not null default 'Prayer app',
  add column if not exists assigned_to text not null default 'Open team',
  add column if not exists flagged_at text,
  add column if not exists prayed_at text,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.prayer_requests enable row level security;

create or replace function public.prayer_app_current_role()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  )
$$;

create or replace function public.prayer_app_is_valid_role()
returns boolean
language sql
stable
as $$
  select public.prayer_app_current_role() in ('intercessor', 'pastor', 'prayer-core')
$$;

create or replace function public.prayer_app_is_privileged_role()
returns boolean
language sql
stable
as $$
  select public.prayer_app_current_role() in ('pastor', 'prayer-core')
$$;

create or replace function public.enforce_prayer_request_workflow()
returns trigger
language plpgsql
as $$
declare
  actor_role text := public.prayer_app_current_role();
begin
  if actor_role not in ('intercessor', 'pastor', 'prayer-core') then
    raise exception 'Your role is not allowed to change prayer workflow records.';
  end if;

  if new.workflow_status not in ('queue', 'review', 'prayed', 'answered') then
    raise exception 'Invalid workflow_status: %', new.workflow_status;
  end if;

  if actor_role = 'intercessor' then
    if old.workflow_status = 'review' and new.workflow_status <> 'review' then
      raise exception 'Only pastors or prayer-core can move requests out of pastoral review.';
    end if;

    if old.workflow_status = 'prayed' and new.workflow_status <> 'prayed' then
      raise exception 'Only pastors or prayer-core can reopen prayed requests.';
    end if;
  end if;

  if new.workflow_status = 'review' and new.flagged_at is null then
    raise exception 'flagged_at is required when workflow_status is review.';
  end if;

  if new.workflow_status = 'prayed' and new.prayed_at is null then
    raise exception 'prayed_at is required when workflow_status is prayed.';
  end if;

  return new;
end;
$$;

drop trigger if exists prayer_request_workflow_guard on public.prayer_requests;

create trigger prayer_request_workflow_guard
before update on public.prayer_requests
for each row
execute function public.enforce_prayer_request_workflow();

drop policy if exists "Authenticated users can read prayer requests" on public.prayer_requests;
drop policy if exists "Authenticated users can insert prayer requests" on public.prayer_requests;
drop policy if exists "Authenticated users can update prayer requests" on public.prayer_requests;
drop policy if exists "Authenticated users can delete prayer requests" on public.prayer_requests;

create policy "Authenticated users can read prayer requests"
on public.prayer_requests
for select
to authenticated
using (public.prayer_app_is_valid_role());

create policy "Authenticated users can insert prayer requests"
on public.prayer_requests
for insert
to authenticated
with check (public.prayer_app_is_valid_role());

create policy "Authenticated users can update prayer requests"
on public.prayer_requests
for update
to authenticated
using (public.prayer_app_is_valid_role())
with check (public.prayer_app_is_valid_role());

create policy "Privileged users can delete prayer requests"
on public.prayer_requests
for delete
to authenticated
using (public.prayer_app_is_privileged_role());