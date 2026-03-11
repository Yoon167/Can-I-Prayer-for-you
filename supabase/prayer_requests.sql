create extension if not exists pgcrypto;

create table if not exists public.prayer_requests (
  id text primary key default gen_random_uuid()::text,
  label text not null,
  owner_user_id uuid not null default auth.uid(),
  completed boolean not null default false,
  answered_at text,
  answered_note text not null default '',
  requested_by text not null,
  is_anonymous boolean not null default false,
  workflow_status text not null default 'queue',
  visibility_scope text not null default 'team',
  category text not null default 'Community care',
  confidentiality text not null default 'Intercessor safe',
  submitted_by text not null default 'Prayer app',
  assigned_to text not null default 'Open team',
  follow_up_status text not null default 'none',
  follow_up_messages jsonb not null default '[]'::jsonb,
  flagged_at text,
  prayed_at text,
  prayed_notice text not null default '',
  prayed_notified_at text,
  prayed_by text not null default '',
  testimony_text text not null default '',
  testimony_shared boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.prayer_requests
  add column if not exists owner_user_id uuid default auth.uid(),
  add column if not exists completed boolean not null default false,
  add column if not exists answered_at text,
  add column if not exists answered_note text not null default '',
  add column if not exists requested_by text not null default 'Community member',
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists workflow_status text not null default 'queue',
  add column if not exists visibility_scope text not null default 'team',
  add column if not exists category text not null default 'Community care',
  add column if not exists confidentiality text not null default 'Intercessor safe',
  add column if not exists submitted_by text not null default 'Prayer app',
  add column if not exists assigned_to text not null default 'Open team',
  add column if not exists follow_up_status text not null default 'none',
  add column if not exists follow_up_messages jsonb not null default '[]'::jsonb,
  add column if not exists flagged_at text,
  add column if not exists prayed_at text,
  add column if not exists prayed_notice text not null default '',
  add column if not exists prayed_notified_at text,
  add column if not exists prayed_by text not null default '',
  add column if not exists testimony_text text not null default '',
  add column if not exists testimony_shared boolean not null default false,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.prayer_requests
  alter column owner_user_id set default auth.uid();

do $$
begin
  if not exists (
    select 1
    from public.prayer_requests
    where owner_user_id is null
  ) then
    alter table public.prayer_requests
      alter column owner_user_id set not null;
  end if;
end;
$$;

update public.prayer_requests
set visibility_scope = case
  when confidentiality ilike '%pastoral%' then 'pastoral'
  else 'team'
end
where visibility_scope is null or visibility_scope = '';

alter table public.prayer_requests enable row level security;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'prayer_requests'
  ) then
    execute 'alter publication supabase_realtime add table public.prayer_requests';
  end if;
end;
$$;

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
  select public.prayer_app_current_role() in ('member', 'intercessor', 'pastor', 'prayer-core')
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
  actor_id uuid := auth.uid();
  actor_role text := public.prayer_app_current_role();
begin
  if new.workflow_status not in ('queue', 'review', 'prayed', 'answered') then
    raise exception 'Invalid workflow_status: %', new.workflow_status;
  end if;

  if new.visibility_scope not in ('team', 'pastoral') then
    raise exception 'Invalid visibility_scope: %', new.visibility_scope;
  end if;

  if new.follow_up_status not in ('none', 'requested') then
    raise exception 'Invalid follow_up_status: %', new.follow_up_status;
  end if;

  if jsonb_typeof(new.follow_up_messages) <> 'array' then
    raise exception 'follow_up_messages must be a JSON array.';
  end if;

  if actor_role not in ('intercessor', 'pastor', 'prayer-core') then
    if actor_id is null or actor_id <> old.owner_user_id then
      raise exception 'Your role is not allowed to change prayer workflow records.';
    end if;

    if new.label is distinct from old.label
      or new.requested_by is distinct from old.requested_by
      or new.is_anonymous is distinct from old.is_anonymous
      or new.category is distinct from old.category
      or new.confidentiality is distinct from old.confidentiality
      or new.submitted_by is distinct from old.submitted_by
      or new.assigned_to is distinct from old.assigned_to
      or new.follow_up_status is distinct from old.follow_up_status
      or new.flagged_at is distinct from old.flagged_at
      or new.prayed_at is distinct from old.prayed_at
      or new.prayed_notice is distinct from old.prayed_notice
      or new.prayed_notified_at is distinct from old.prayed_notified_at
      or new.prayed_by is distinct from old.prayed_by
      or new.visibility_scope is distinct from old.visibility_scope
      or new.owner_user_id is distinct from old.owner_user_id
    then
      raise exception 'Members can only mark their own requests answered.';
    end if;

    if new.follow_up_messages is distinct from old.follow_up_messages then
      return new;
    end if;

    if new.testimony_text is distinct from old.testimony_text or new.testimony_shared is distinct from old.testimony_shared then
      return new;
    end if;

    if new.workflow_status not in (old.workflow_status, 'answered') then
      raise exception 'Members can only move their own requests to answered.';
    end if;

    return new;
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
drop policy if exists "Privileged users can delete prayer requests" on public.prayer_requests;

create policy "Authenticated users can read prayer requests"
on public.prayer_requests
for select
to authenticated
using (
  public.prayer_app_is_valid_role()
  and (
    visibility_scope = 'team'
    or owner_user_id = auth.uid()
    or public.prayer_app_is_privileged_role()
  )
);

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