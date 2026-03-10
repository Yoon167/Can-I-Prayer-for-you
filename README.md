# Prayer App

This project is a role-aware prayer workflow app built with React and Vite. It includes:

- prayer requests with journal tracking
- swipe-style intercessor queue handling
- pastoral review routing
- answered-prayer history
- role-specific Prayer Hub views
- Supabase-backed sign-in when configured
- member profiles with optional anonymous prayer requests
- live daily devotion content with curated daily teaching fallback
- Supabase-managed daily teaching feed for pastors and owners

## Use Supabase free tier

If you want real shared accounts and synced prayer data, use the Supabase free tier. This app already supports it.

Start here: [SUPABASE_FREE_SETUP.md](SUPABASE_FREE_SETUP.md)

The short version:

1. Create a free Supabase project.
2. Run [supabase/bootstrap.sql](supabase/bootstrap.sql) in Supabase SQL Editor.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as GitHub Actions secrets.
4. Push to `main` or rerun the Pages workflow.

After that, GitHub Pages will build the site with your Supabase public credentials and the app will stop using local-only demo storage.
The bootstrap script also seeds one daily teaching entry for the current date so the synced teaching feed is not empty on first launch.

## Publish without a database

If you only have GitHub and do not want a database yet, you can still publish the app as a static website.

In that mode:

- sign-in uses the app's local demo flow
- profiles, prayer requests, praises, and journals are saved in each visitor's browser
- data does not sync across devices or between different people
- daily devotion still attempts to load from the public feed, with built-in fallback content when needed

This repo already includes [deploy-pages.yml](.github/workflows/deploy-pages.yml) so GitHub can build and publish it for you. If you later add Supabase Actions secrets, the same workflow will build the synced version automatically.

## Publish to GitHub Pages

1. Push this project to a GitHub repository.
2. Make sure your default branch is `main`.
3. In GitHub, open `Settings` > `Pages`.
4. Under `Build and deployment`, choose `GitHub Actions` as the source.
5. Push a commit to `main`, or run the `Deploy GitHub Pages` workflow manually from the `Actions` tab.
6. After the workflow finishes, GitHub will give you the live site URL.

You do not need `.env` or Supabase credentials for this publish path.

## Replace the app logo later

The live app now uses [public/brand-mark.svg](public/brand-mark.svg) as the main logo in the browser tab, auth screen, and app navigation.

When your final logo is ready:

1. Replace [public/brand-mark.svg](public/brand-mark.svg) with your final file using the same filename.
2. If your logo is not an SVG, you can still use a PNG, but keep the same path and update the references in [index.html](index.html) and [src/components/AppLogo.jsx](src/components/AppLogo.jsx).
3. Replace [public/social-preview.svg](public/social-preview.svg) if you want social sharing cards on WhatsApp, Facebook, or X to match the final brand.
4. Run `npm run build`.
5. Commit and push to `main` so GitHub Pages redeploys.

If you want a different logo size or spacing in the app, adjust the logo styles in [src/App.css](src/App.css).

## Run locally

```bash
npm install
npm run dev
```

The home page tries to load live daily content from public feeds:

- daily devotion via `OurManna`
- daily teaching from Supabase when configured, otherwise the app's rotating teaching library

If the live devotion feed is unavailable, the app falls back to the built-in curated daily content so the home page still works.

To manage daily teaching from the app, run [supabase/daily_teachings.sql](supabase/daily_teachings.sql) in Supabase SQL Editor. After that, pastor- and owner-level profiles can edit the daily teaching from the Profile screen, and the home page will pull the latest published teaching from Supabase.

## Supabase auth setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project.
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` if you want to provision users from this repo.
4. Create users in Supabase Auth.
5. Assign each user a role in `app_metadata.role` or `user_metadata.role`.
6. Use one of these role values:

```text
member
intercessor
pastor
prayer-core
```

## Provision a user from the repo

Once the admin environment variables are set, you can create or update a user with the correct role metadata:

```bash
npm run provision:user -- --email user@church.org --password "StrongPass123!" --role intercessor
```

The script will:

- create the user if they do not exist
- update the password if they already exist
- write the selected role to both `app_metadata.role` and `user_metadata.role`

If Supabase is not configured, the app falls back to the local demo sign-in flow so the UI remains usable.

## Member profile persistence

When Supabase auth is enabled, the member profile saved from the Profile view is written to the signed-in user's `user_metadata.memberProfile` object. That keeps the display name and full name tied to the account instead of only the current browser.

If Supabase is not configured, the member profile is stored locally in browser storage as a demo fallback.

## Shared prayer requests across devices

To let signed-in members share the same prayer request list across devices, run [supabase/prayer_requests.sql](supabase/prayer_requests.sql) in Supabase SQL Editor.

That script does three things:

- creates the `prayer_requests` table if it does not exist
- adds any missing workflow columns if you started from an older version
- installs role-aware RLS policies and a trigger that enforces workflow transitions
- adds `public.prayer_requests` to `supabase_realtime` so request changes appear on other signed-in devices

The policy model is:

- `intercessor`, `pastor`, and `prayer-core` can read and create requests
- all three roles can update queue and prayed state from the app
- only `pastor` and `prayer-core` can delete requests
- only `pastor` and `prayer-core` can move requests out of pastoral review

Reference SQL:

```sql
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
```

Once the table exists, the main request list, swipe queue, pastoral review, and prayed deck all sync through Supabase for signed-in users. If the table is missing, the app stays usable with local-only request storage.

## Personal journal sync across devices

To let each signed-in member keep their own journal across devices, run [supabase/journal_entries.sql](supabase/journal_entries.sql) in Supabase SQL Editor.

That script creates a `journal_entries` table with row-level security tied to `auth.uid()`, so each signed-in user can only read and manage their own entries.

Reference SQL:

```sql
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
```

If the table is missing, the journal stays usable with local-only browser storage.

## Checks

```bash
npm run build
npm run lint
```
