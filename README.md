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

## Install on mobile

This app now builds as an installable PWA, so it can run like an app on mobile instead of only inside a normal browser tab.

Android:

1. Open the deployed site in Chrome.
2. Tap the in-app `Install app` button, or use Chrome's `Add to Home screen` menu action.
3. Launch it from your home screen after installation.

iPhone or iPad:

1. Open the deployed site in Safari.
2. Tap `Share`.
3. Tap `Add to Home Screen`.
4. Launch it from the new home screen icon.

If you want a full Play Store or App Store package later, the next step would be wrapping this PWA with Capacitor. The current change is the fastest path to getting the app installable on phones right away.

## Build Android app

This repo now includes a real Capacitor Android project in [android](android) with app id `io.github.yoon167.prayerapp`.

To refresh the Android app with the latest web code:

```bash
npm run android:sync
```

To open the native project in Android Studio:

```bash
npm run android:open
```

From Android Studio you can then:

1. connect an Android phone with USB debugging enabled, or start an emulator
2. press `Run` to install the app directly on the device
3. use `Build > Generate App Bundles / APKs` when you want an APK or AAB for release

What you still need on this machine:

1. Android Studio
2. Android SDK installed from Android Studio
3. a phone or emulator for testing

Capacitor is already set up in this repo, so you do not need to create the Android project again.

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

To let signed-in members share the same prayer request list across devices, run [supabase/bootstrap.sql](supabase/bootstrap.sql) in Supabase SQL Editor.

That is the authoritative script for the current app. It creates and upgrades the prayer-request schema used by the latest build, including:

- the `prayer_requests` table itself
- newer columns such as `owner_user_id`, `visibility_scope`, `follow_up_status`, `follow_up_messages`, `prayed_notice`, `prayed_notified_at`, `prayed_by`, `testimony_text`, and `testimony_shared`
- role-aware RLS policies and the workflow guard trigger
- `supabase_realtime` wiring so shared request updates appear across signed-in devices

The policy model is:

- `member`, `intercessor`, `pastor`, and `prayer-core` can create requests
- `team` requests are readable by valid signed-in roles, while `pastoral` requests stay limited to the owner or privileged roles
- members can update only their own requests in the limited ways allowed by the workflow guard
- only `pastor` and `prayer-core` can delete requests
- only `pastor` and `prayer-core` can move requests out of pastoral review

If you need a prayer-request-only upgrade instead of the full setup, [supabase/prayer_requests.sql](supabase/prayer_requests.sql) is kept in sync with the same schema shape, but `bootstrap.sql` should be your default path.

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
