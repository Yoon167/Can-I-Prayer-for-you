import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { firebaseDb, isFirebaseConfigured } from '../lib/firebaseClient.js'
import { createFirestoreSubscription, normalizeFirebaseSyncError } from './firebaseSyncUtils.js'

const prayerRequestsCollection = 'prayer_requests'

function normalizeFollowUpMessages(messages) {
  if (!Array.isArray(messages)) {
    return []
  }

  return messages
    .filter((message) => message && typeof message === 'object')
    .map((message) => ({
      id: message.id ?? '',
      text: message.text ?? '',
      authorName: message.authorName ?? 'Prayer team',
      authorRole: message.authorRole ?? 'Member',
      senderType: message.senderType ?? 'team',
      createdAt: message.createdAt ?? null,
    }))
    .filter((message) => message.text)
}

function normalizePrayerRequestRecord(record, id) {
  return {
    id,
    label: record.label ?? '',
    completed: Boolean(record.completed),
    answeredAt: record.answeredAt ?? null,
    answeredNote: record.answeredNote ?? '',
    requestedBy: record.requestedBy ?? 'Community member',
    isAnonymous: Boolean(record.isAnonymous),
    workflowStatus: record.workflowStatus ?? 'queue',
    category: record.category ?? 'Community care',
    confidentiality: record.confidentiality ?? 'Intercessor safe',
    submittedBy: record.submittedBy ?? 'Prayer app',
    assignedTo: record.assignedTo ?? 'Open team',
    flaggedAt: record.flaggedAt ?? null,
    prayedAt: record.prayedAt ?? null,
    ownerUserId: record.ownerUserId ?? null,
    visibilityScope:
      record.visibilityScope ??
      ((record.confidentiality ?? '').toLowerCase().includes('pastoral') ? 'pastoral' : 'team'),
    followUpStatus: record.followUpStatus ?? 'none',
    followUpMessages: normalizeFollowUpMessages(record.followUpMessages),
    prayedNotice: record.prayedNotice ?? '',
    prayedNotifiedAt: record.prayedNotifiedAt ?? null,
    prayedBy: record.prayedBy ?? '',
    testimonyText: record.testimonyText ?? '',
    testimonyShared: Boolean(record.testimonyShared),
  }
}

function buildPrayerRequestPayload(item) {
  const payload = {
    label: item.label,
    completed: item.completed,
    answeredAt: item.answeredAt,
    answeredNote: item.answeredNote,
    requestedBy: item.requestedBy,
    isAnonymous: item.isAnonymous,
    workflowStatus: item.workflowStatus,
    category: item.category,
    confidentiality: item.confidentiality,
    submittedBy: item.submittedBy,
    assignedTo: item.assignedTo,
    flaggedAt: item.flaggedAt,
    prayedAt: item.prayedAt,
    ownerUserId: item.ownerUserId ?? null,
    visibilityScope: item.visibilityScope ?? 'team',
    followUpStatus: item.followUpStatus ?? 'none',
    followUpMessages: item.followUpMessages ?? [],
    prayedNotice: item.prayedNotice ?? '',
    prayedNotifiedAt: item.prayedNotifiedAt ?? null,
    prayedBy: item.prayedBy ?? '',
    testimonyText: item.testimonyText ?? '',
    testimonyShared: item.testimonyShared ?? false,
    updatedAt: new Date().toISOString(),
  }

  return payload
}

function buildPrayerRequestUpdatePayload(updates) {
  const nextPayload = {}

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      nextPayload[key] = value
    }
  })

  nextPayload.updatedAt = new Date().toISOString()

  if ('followUpMessages' in nextPayload) {
    nextPayload.followUpMessages = normalizeFollowUpMessages(nextPayload.followUpMessages)
  }

  return nextPayload
}

export const isPrayerRequestSyncConfigured = isFirebaseConfigured

export async function listPrayerRequests() {
  if (!firebaseDb || !isPrayerRequestSyncConfigured) {
    return { items: [], error: null }
  }

  try {
    const snapshot = await getDocs(
      query(collection(firebaseDb, prayerRequestsCollection), orderBy('createdAt', 'desc')),
    )

    return {
      items: snapshot.docs.map((documentSnapshot) =>
        normalizePrayerRequestRecord(documentSnapshot.data(), documentSnapshot.id),
      ),
      error: null,
    }
  } catch (error) {
    return { items: [], error: normalizeFirebaseSyncError(error, 'prayer requests') }
  }
}

export async function createPrayerRequest(item) {
  if (!firebaseDb || !isPrayerRequestSyncConfigured) {
    return { item, error: null }
  }

  try {
    const payload = {
      ...buildPrayerRequestPayload(item),
      createdAt: item.createdAt ?? new Date().toISOString(),
    }
    await setDoc(doc(firebaseDb, prayerRequestsCollection, item.id), payload)

    return {
      item: normalizePrayerRequestRecord(payload, item.id),
      error: null,
    }
  } catch (error) {
    return { item: null, error: normalizeFirebaseSyncError(error, 'prayer requests') }
  }
}

export async function updatePrayerRequest(itemId, updates) {
  if (!firebaseDb || !isPrayerRequestSyncConfigured) {
    return { item: { id: itemId, ...updates }, error: null }
  }

  try {
    const documentRef = doc(firebaseDb, prayerRequestsCollection, itemId)
    const existingSnapshot = await getDoc(documentRef)
    const existingRecord = existingSnapshot.exists() ? existingSnapshot.data() : {}
    const nextRecord = {
      ...existingRecord,
      ...buildPrayerRequestUpdatePayload(updates),
      createdAt: existingRecord.createdAt ?? updates.createdAt ?? new Date().toISOString(),
    }

    await setDoc(documentRef, nextRecord, { merge: true })

    return {
      item: normalizePrayerRequestRecord(nextRecord, itemId),
      error: null,
    }
  } catch (error) {
    return { item: null, error: normalizeFirebaseSyncError(error, 'prayer requests') }
  }
}

export async function deletePrayerRequest(itemId) {
  if (!firebaseDb || !isPrayerRequestSyncConfigured) {
    return { error: null }
  }

  try {
    await deleteDoc(doc(firebaseDb, prayerRequestsCollection, itemId))

    return {
      error: null,
    }
  } catch (error) {
    return {
      error: normalizeFirebaseSyncError(error, 'prayer requests'),
    }
  }
}

export function subscribeToPrayerRequests(onItemsChange, onError) {
  if (!firebaseDb || !isPrayerRequestSyncConfigured) {
    return () => {}
  }

  return createFirestoreSubscription({
    queryRef: query(collection(firebaseDb, prayerRequestsCollection), orderBy('createdAt', 'desc')),
    resourceLabel: 'prayer requests',
    loadLatest: listPrayerRequests,
    onData: ({ items }) => onItemsChange(items),
    onError,
  })
}