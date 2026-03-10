create extension if not exists pgcrypto;

create table if not exists public.member_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  role text not null default 'member',
  full_name text not null default '',
  display_name text not null default '',
  phone text not null default '',
  address text not null default '',
  church_name text not null default '',
  pastor_name text not null default '',
  bio text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint member_accounts_role_check check (role in ('member', 'intercessor', 'pastor', 'prayer-core'))
);

alter table public.member_accounts
  add column if not exists email text not null default '',
  add column if not exists role text not null default 'member',
  add column if not exists full_name text not null default '',
  add column if not exists display_name text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists address text not null default '',
  add column if not exists church_name text not null default '',
  add column if not exists pastor_name text not null default '',
  add column if not exists bio text not null default '',
  add column if not exists avatar_url text not null default '',
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.member_accounts enable row level security;

create or replace function public.prayer_app_role_for_user(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select member_accounts.role
      from public.member_accounts
      where member_accounts.user_id = target_user_id
      limit 1
    ),
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    'member'
  )
$$;

create or replace function public.prayer_app_current_role()
returns text
language sql
stable
as $$
  select public.prayer_app_role_for_user(auth.uid())
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

create or replace function public.touch_member_accounts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.enforce_member_account_changes()
returns trigger
language plpgsql
as $$
declare
  actor_role text := public.prayer_app_current_role();
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to manage member accounts.';
  end if;

  if tg_op = 'INSERT' then
    if actor_role not in ('pastor', 'prayer-core') and new.role <> 'member' then
      raise exception 'Only pastors or prayer-core can assign elevated member roles.';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if actor_role not in ('pastor', 'prayer-core') and old.role is distinct from new.role then
      raise exception 'Only pastors or prayer-core can change member roles.';
    end if;
  end if;

  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists member_accounts_updated_at on public.member_accounts;
drop trigger if exists member_accounts_guard on public.member_accounts;

create trigger member_accounts_updated_at
before update on public.member_accounts
for each row
execute function public.touch_member_accounts_updated_at();

create trigger member_accounts_guard
before insert or update on public.member_accounts
for each row
execute function public.enforce_member_account_changes();

drop policy if exists "Users can read their own member account" on public.member_accounts;
drop policy if exists "Privileged users can read all member accounts" on public.member_accounts;
drop policy if exists "Users can insert their own member account" on public.member_accounts;
drop policy if exists "Privileged users can insert member accounts" on public.member_accounts;
drop policy if exists "Users can update their own member account" on public.member_accounts;
drop policy if exists "Privileged users can update all member accounts" on public.member_accounts;

create policy "Users can read their own member account"
on public.member_accounts
for select
to authenticated
using (auth.uid() = user_id);

create policy "Privileged users can read all member accounts"
on public.member_accounts
for select
to authenticated
using (public.prayer_app_is_privileged_role());

create policy "Users can insert their own member account"
on public.member_accounts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Privileged users can insert member accounts"
on public.member_accounts
for insert
to authenticated
with check (public.prayer_app_is_privileged_role());

create policy "Users can update their own member account"
on public.member_accounts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Privileged users can update all member accounts"
on public.member_accounts
for update
to authenticated
using (public.prayer_app_is_privileged_role())
with check (public.prayer_app_is_privileged_role());

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
  flagged_at text,
  prayed_at text,
  prayed_notice text not null default '',
  prayed_notified_at text,
  prayed_by text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.prayer_requests
  add column if not exists owner_user_id uuid not null default auth.uid(),
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
  add column if not exists flagged_at text,
  add column if not exists prayed_at text,
  add column if not exists prayed_notice text not null default '',
  add column if not exists prayed_notified_at text,
  add column if not exists prayed_by text not null default '',
  add column if not exists created_at timestamptz not null default timezone('utc', now());

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
      or new.flagged_at is distinct from old.flagged_at
      or new.prayed_at is distinct from old.prayed_at
      or new.prayed_notice is distinct from old.prayed_notice
      or new.prayed_notified_at is distinct from old.prayed_notified_at
      or new.prayed_by is distinct from old.prayed_by
      or new.visibility_scope is distinct from old.visibility_scope
      or new.follow_up_status is distinct from old.follow_up_status
      or new.owner_user_id is distinct from old.owner_user_id
    then
      raise exception 'Members can only mark their own requests answered.';
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

create table if not exists public.journal_entries (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null default auth.uid(),
  title text not null,
  detail text not null,
  entry_date text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.journal_entries
  add column if not exists user_id uuid not null default auth.uid(),
  add column if not exists title text not null default '',
  add column if not exists detail text not null default '',
  add column if not exists entry_date text not null default '',
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.journal_entries enable row level security;

drop policy if exists "Users can read their own journal entries" on public.journal_entries;
drop policy if exists "Users can insert their own journal entries" on public.journal_entries;
drop policy if exists "Users can delete their own journal entries" on public.journal_entries;

create policy "Users can read their own journal entries"
on public.journal_entries
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own journal entries"
on public.journal_entries
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete their own journal entries"
on public.journal_entries
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.daily_teachings (
  id uuid primary key default gen_random_uuid(),
  publish_date date not null unique,
  title text not null,
  speaker text not null,
  theme text not null,
  summary text not null,
  source text not null default 'Supabase teaching feed',
  link text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.daily_teachings
  add column if not exists publish_date date,
  add column if not exists title text not null default '',
  add column if not exists speaker text not null default '',
  add column if not exists theme text not null default '',
  add column if not exists summary text not null default '',
  add column if not exists source text not null default 'Supabase teaching feed',
  add column if not exists link text,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.daily_teachings
set publish_date = current_date
where publish_date is null;

alter table public.daily_teachings
  alter column publish_date set not null;

alter table public.daily_teachings enable row level security;

create or replace function public.touch_daily_teachings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists daily_teachings_updated_at on public.daily_teachings;

create trigger daily_teachings_updated_at
before update on public.daily_teachings
for each row
execute function public.touch_daily_teachings_updated_at();

drop policy if exists "Authenticated users can read daily teachings" on public.daily_teachings;
drop policy if exists "Privileged users can insert daily teachings" on public.daily_teachings;
drop policy if exists "Privileged users can update daily teachings" on public.daily_teachings;
drop policy if exists "Privileged users can delete daily teachings" on public.daily_teachings;

create policy "Authenticated users can read daily teachings"
on public.daily_teachings
for select
to authenticated
using (public.prayer_app_is_valid_role());

create policy "Privileged users can insert daily teachings"
on public.daily_teachings
for insert
to authenticated
with check (public.prayer_app_is_privileged_role());

create policy "Privileged users can update daily teachings"
on public.daily_teachings
for update
to authenticated
using (public.prayer_app_is_privileged_role())
with check (public.prayer_app_is_privileged_role());

create policy "Privileged users can delete daily teachings"
on public.daily_teachings
for delete
to authenticated
using (public.prayer_app_is_privileged_role());

insert into public.daily_teachings (
  publish_date,
  title,
  speaker,
  theme,
  summary,
  source,
  link
)
values (
  current_date,
  'Faithful in the Quiet Place',
  'Prayer App Team',
  'Consistent prayer',
  'Prayer grows strongest in steady, hidden faithfulness. Return to God with honesty, scripture, and trust even when the day feels ordinary.',
  'Supabase teaching feed',
  ''
)
on conflict (publish_date) do nothing;