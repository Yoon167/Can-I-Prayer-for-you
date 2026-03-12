import { getDayIndex, teachingLibrary } from '../data/dailyContent.js'
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { firebaseDb, isFirebaseConfigured } from '../lib/firebaseClient.js'
import { createFirestoreSubscription, normalizeFirebaseSyncError } from './firebaseSyncUtils.js'

const dailyTeachingsCollection = 'daily_teachings'

function getTodayDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function normalizeTeachingRecord(record, id) {
  return {
    id,
    publishDate: record.publishDate,
    title: record.title ?? '',
    speaker: record.speaker ?? '',
    theme: record.theme ?? '',
    summary: record.summary ?? '',
    source: record.source ?? 'Firebase teaching feed',
    isLive: true,
    link: record.link ?? null,
  }
}

function buildTeachingPayload(teaching) {
  return {
    publishDate: teaching.publishDate,
    title: teaching.title,
    speaker: teaching.speaker,
    theme: teaching.theme,
    summary: teaching.summary,
    source: teaching.source,
    link: teaching.link ?? null,
    updatedAt: new Date().toISOString(),
  }
}

export const isTeachingSyncConfigured = isFirebaseConfigured

export function getFallbackTeaching(date = new Date()) {
  const teaching = teachingLibrary[getDayIndex(date, teachingLibrary.length)]

  return {
    ...teaching,
    publishDate: getTodayDateKey(date),
    source: 'Curated fallback',
    isLive: false,
    link: null,
  }
}

export async function getFeaturedTeaching(date = new Date()) {
  if (!firebaseDb || !isTeachingSyncConfigured) {
    return { item: getFallbackTeaching(date), error: null }
  }

  try {
    const todayKey = getTodayDateKey(date)
    const snapshot = await getDocs(
      query(
        collection(firebaseDb, dailyTeachingsCollection),
        where('publishDate', '<=', todayKey),
        orderBy('publishDate', 'desc'),
        limit(1),
      ),
    )

    if (snapshot.empty) {
      return { item: getFallbackTeaching(date), error: null }
    }

    const documentSnapshot = snapshot.docs[0]
    return { item: normalizeTeachingRecord(documentSnapshot.data(), documentSnapshot.id), error: null }
  } catch (error) {
    return { item: getFallbackTeaching(date), error: normalizeFirebaseSyncError(error, 'daily teaching') }
  }
}

export async function saveFeaturedTeaching(teaching) {
  if (!firebaseDb || !isTeachingSyncConfigured) {
    return { item: { ...teaching, isLive: false }, error: null }
  }

  try {
    const documentId = teaching.publishDate
    const payload = buildTeachingPayload(teaching)
    await setDoc(doc(firebaseDb, dailyTeachingsCollection, documentId), payload, { merge: true })

    return { item: normalizeTeachingRecord(payload, documentId), error: null }
  } catch (error) {
    return { item: null, error: normalizeFirebaseSyncError(error, 'daily teaching') }
  }
}

export function subscribeToFeaturedTeaching(onItemChange, onError) {
  if (!firebaseDb || !isTeachingSyncConfigured) {
    return () => {}
  }

  const todayKey = getTodayDateKey(new Date())

  return createFirestoreSubscription({
    queryRef: query(
      collection(firebaseDb, dailyTeachingsCollection),
      where('publishDate', '<=', todayKey),
      orderBy('publishDate', 'desc'),
      limit(1),
    ),
    resourceLabel: 'daily teaching',
    loadLatest: getFeaturedTeaching,
    onData: ({ item }) => onItemChange(item),
    onError,
  })
}