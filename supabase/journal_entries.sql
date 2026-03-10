create extension if not exists pgcrypto;

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