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
3. Leave email confirmation on so new members must confirm ownership of their address.
4. Open `Authentication` > `SMTP Settings` and enable custom SMTP.
5. Add your Resend SMTP host, port, username, password, sender name, and sender address.
6. Set the site URL to your deployed app URL. If you are using GitHub Pages for this project, use `https://yoon167.github.io/Can-I-Prayer-for-you/`.
7. Add that same URL to the redirect URL list.

Important notes:

- Without custom SMTP, Supabase only delivers auth email to project team members and the default mailer is heavily rate-limited.
- If confirmation links open but do not complete sign-in, the usual cause is a mismatched site URL or redirect URL.
- If you switch to Resend SMTP, test with a real non-team email address after saving the SMTP settings.

## 2.1 Confirmation link callback for static hosting

Because this app is deployed as a static single-page app, the safest callback target is the main app URL, not a nested route like `/auth/confirm`.

If you customize the Supabase confirmation email template to use token hashes, point it back to your main app URL in this shape:

```html
<a href="{{ .SiteURL }}?token_hash={{ .TokenHash }}&type={{ .Type }}">Confirm your email</a>
```

The app now detects those parameters on load, verifies the token with Supabase, clears the URL, and restores the signed-in session.

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

If you already ran an older prayer-request-only script before, run [supabase/bootstrap.sql](supabase/bootstrap.sql) again now. The live app expects newer columns such as `owner_user_id`, `visibility_scope`, `follow_up_status`, and `testimony_shared`, and the full bootstrap script is the authoritative upgrade path.

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

## 7. Repair pastor access for existing users

If a pastor or prayer-core user still cannot see preaching, analytics, prayer review, or today snapshot data, the usual cause is a stale `public.member_accounts.role` row left behind from an earlier `member` signup.

Run these in Supabase SQL Editor in order:

1. Run [supabase/bootstrap.sql](supabase/bootstrap.sql) again so the latest trigger and role sync logic are installed.
2. Run [supabase/repair_member_account_roles.sql](supabase/repair_member_account_roles.sql) to backfill elevated roles from `auth.users` into `public.member_accounts`.

After that, sign out and sign back in with the promoted account.