create extension if not exists pgcrypto;

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