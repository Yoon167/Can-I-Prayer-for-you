# Supabase Free Setup

This app already supports Supabase. If you want real shared sign-in and multi-device sync, the fastest path is the Supabase free tier.

## What this gives you

- shared sign-in across devices
- synced prayer requests
- synced personal journals
- synced daily teaching management
- no change to your React app architecture

## 1. Create a free Supabase project

1. Go to `https://supabase.com/`.
2. Create a new project on the free tier.
3. Wait for the database and Auth service to finish provisioning.

## 2. Configure Auth

1. Open `Authentication` in Supabase.
2. Enable `Email` sign-in.
3. For the simplest first launch, turn off email confirmation while testing.
4. Set the site URL to `https://yoon167.github.io/Can-I-Prayer-for-you/`.
5. Add the same URL to the redirect URL list.

## 3. Create the app tables

1. Open `SQL Editor` in Supabase.
2. Run [supabase/bootstrap.sql](supabase/bootstrap.sql).

That single script creates:

- `prayer_requests`
- `journal_entries`
- `daily_teachings`
- row-level security policies
- Supabase Realtime wiring for shared prayer request updates
- workflow and timestamp triggers
- one starter daily teaching for today so the home page has live teaching content immediately

If shared requests are the only thing you need to repair, you can run [supabase/prayer_requests.sql](supabase/prayer_requests.sql) by itself. That script creates the `prayer_requests` table, updates older schemas, and adds the table to `supabase_realtime` for live multi-device updates.

## 4. Add GitHub build secrets

In your GitHub repository:

1. Open `Settings` > `Secrets and variables` > `Actions`.
2. Add a secret named `VITE_SUPABASE_URL`.
3. Add a secret named `VITE_SUPABASE_ANON_KEY`.

These must be repository Actions secrets, not environment-only secrets, because the `build` job reads them before the `github-pages` deploy environment is used.

Get both values from `Project Settings` > `API` in Supabase.

The GitHub Pages workflow already reads those secrets during `npm run build`.

## 5. Redeploy the site

1. Push any commit to `main`, or rerun the Pages workflow.
2. Open the live site after the workflow finishes.

At that point the app will switch from local-only demo mode to Supabase-backed auth and sync.

## 6. Use roles in Supabase

This app expects one of these role values in `app_metadata.role` or `user_metadata.role`:

```text
member
intercessor
pastor
prayer-core
```

New signups should stay `member` by default. Only pastors or prayer-core should assign elevated roles.

If you want to create or update users from the repo later, you can still use the provisioning script with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` locally.