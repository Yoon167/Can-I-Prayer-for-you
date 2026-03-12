# Migrate Supabase Data To Firebase

This repo includes a one-time migration script that copies the existing Supabase auth users and data collections into Firebase Auth and Firestore.

## What it migrates

- Supabase Auth users to Firebase Auth
- `member_accounts` to Firestore `member_accounts`
- `prayer_requests` to Firestore `prayer_requests`
- `journal_entries` to Firestore `journal_entries`
- `daily_teachings` to Firestore `daily_teachings`

## Important limitation

Supabase passwords cannot be exported in a reusable form, so Firebase users must be created with a temporary password.

After migration, users should either:

1. sign in with the temporary password and change it
2. or receive a password reset email from Firebase

## Required environment variables

Supabase source:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Firebase target:

```text
GOOGLE_APPLICATION_CREDENTIALS=
```

or:

```text
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

The migration script now reads `.env` and `.env.local` automatically, so you can place these values in a local env file instead of exporting them manually in PowerShell.

## Run the migration

```bash
npm install
npm run migrate:supabase -- --default-password "TempPass123!"
```

Useful flags:

- `--default-password "TempPass123!"`: required when migrating auth users
- `--skip-auth`: skip Firebase Auth user creation and copy Firestore data only
- `--skip-member-accounts`: skip `member_accounts`
- `--skip-prayer-requests`: skip `prayer_requests`
- `--skip-journal-entries`: skip `journal_entries`
- `--skip-daily-teachings`: skip `daily_teachings`
- `--report-file migration-report.json`: write a JSON summary file

## Recommended order

1. Create and verify the Firebase project first.
2. Deploy Firestore rules.
3. Run the migration script against production Supabase.
4. Verify a few migrated users, prayer requests, journals, and teachings in Firebase Console.
5. Switch the app's frontend env vars to Firebase.
6. Tell users to use the temporary password or a Firebase password reset flow.

## Notes

- The script maps Supabase user IDs to Firebase user IDs so Firestore ownership fields stay aligned with Firebase Auth.
- If you use `--skip-auth`, user-owned records are copied with their original Supabase IDs, which is useful for archival import but not for live sign-in cutover.
- The script upserts records, so rerunning it is safe for iterative dry runs.