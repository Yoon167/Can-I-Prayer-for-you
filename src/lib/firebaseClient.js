import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim(),
}

const firebaseConfigLabels = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
  measurementId: 'VITE_FIREBASE_MEASUREMENT_ID',
}

function isPlaceholderValue(value) {
  if (!value) {
    return true
  }

  const normalizedValue = value.toLowerCase()

  return (
    normalizedValue.includes('your-api-key') ||
    normalizedValue.includes('your-project-id') ||
    normalizedValue.includes('your-app-id') ||
    normalizedValue.includes('example')
  )
}

export const isFirebaseConfigured =
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId,
  ) &&
  !Object.values(firebaseConfig)
    .filter(Boolean)
    .some((value) => isPlaceholderValue(value))

export const firebaseConfigurationDiagnostics = {
  configured: isFirebaseConfigured,
  missing: Object.entries(firebaseConfigLabels)
    .filter(([configKey]) => !firebaseConfig[configKey])
    .map(([, label]) => label),
  placeholders: Object.entries(firebaseConfigLabels)
    .filter(([configKey]) => firebaseConfig[configKey] && isPlaceholderValue(firebaseConfig[configKey]))
    .map(([, label]) => label),
}

const firebaseApp = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null
export const firebaseDb = firebaseApp ? getFirestore(firebaseApp) : null
