# Prayer App

This project is a role-aware prayer workflow app built with React, Vite, and Capacitor. It supports local-only usage out of the box and shared multi-device sync when Firebase Auth and Firestore are configured.

## Features

- role-aware prayer request workflows
- intercessor queue and pastoral review screens
- member profiles
- personal journal entries
- live daily devotion content with curated fallback teaching
- Android packaging through Capacitor

## Firebase setup

Firebase is now the app's cloud backend.

Start here: [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

At a minimum you need these Vite environment variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Optional:

- `VITE_FIREBASE_MEASUREMENT_ID`

Without Firebase configured, the app falls back to local browser storage for accounts, prayer requests, and journal entries.

## Provision a user

You can create or update a Firebase Auth user and keep the matching Firestore role document in sync with:

```bash
npm run provision:user -- --email user@church.org --password "StrongPass123!" --role intercessor
```

The script accepts either:

- `GOOGLE_APPLICATION_CREDENTIALS`
- or `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`

## Migrate existing Supabase data

If you already have production data in Supabase, use [MIGRATE_SUPABASE_TO_FIREBASE.md](MIGRATE_SUPABASE_TO_FIREBASE.md).

The migration script copies:

- auth users into Firebase Auth with a temporary password
- `member_accounts` into Firestore
- `prayer_requests` into Firestore
- `journal_entries` into Firestore
- `daily_teachings` into Firestore

## Run locally

```bash
npm install
npm run dev
```

## Android

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
