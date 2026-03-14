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

## Run locally

```bash
npm install
npm run dev
```

## Checks

```bash
npm run build
npm run lint
```
