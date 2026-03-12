# Firebase Setup

This app uses Firebase Auth for sign-in and Firestore for synced prayer data.

## 1. Create a Firebase project

1. Go to `https://console.firebase.google.com/`.
2. Create a new project.
3. Add a Web app inside that project.

## 2. Enable Authentication

1. Open `Authentication`.
2. Enable the `Email/Password` provider.
3. In `Settings`, add your deployed domain to `Authorized domains`.

The app expects email verification to stay enabled in the app flow. New accounts are created first, then the app sends a verification email and blocks cloud session use until the address is verified.

## 3. Enable Firestore

1. Open `Firestore Database`.
2. Create a database in production mode.
3. Choose the region closest to your users.

The app uses these collections:

- `member_accounts`
- `prayer_requests`
- `journal_entries`
- `daily_teachings`

## 4. Add Vite environment variables

Set these in your local `.env` and any deployment secrets:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

`VITE_FIREBASE_MEASUREMENT_ID` is optional.

## 5. Deploy Firestore rules

You need Firestore rules that:

- allow authenticated members to read and write their own `member_accounts` document
- allow signed-in users to create prayer requests and journal entries
- restrict elevated role changes and pastoral-only actions to pastor or prayer-core accounts

Starter example:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    match /member_accounts/{userId} {
      allow read: if signedIn();
      allow create, update: if signedIn() && request.auth.uid == userId;
    }

    match /journal_entries/{entryId} {
      allow read, write: if signedIn();
    }

    match /prayer_requests/{requestId} {
      allow read, write: if signedIn();
    }

    match /daily_teachings/{teachingId} {
      allow read: if true;
      allow write: if signedIn();
    }
  }
}
```

That example is intentionally broad. Tighten it before production if you need strict role-based protection.

## 6. Provision elevated users

Use the repo script to create or update users:

```bash
npm run provision:user -- --email pastor@church.org --password "StrongPass123!" --role pastor
```

The script also writes the matching Firestore `member_accounts/{uid}` document so role-aware screens can resolve immediately.

## 7. Deploy

After the web config variables are available to your build:

1. Run `npm run build`.
2. Deploy the built app.
3. Confirm your deployed domain is listed in Firebase Auth authorized domains.

## 8. Migrate existing Supabase data

If you already have live data in Supabase, use [MIGRATE_SUPABASE_TO_FIREBASE.md](MIGRATE_SUPABASE_TO_FIREBASE.md) before cutting users over to Firebase.
