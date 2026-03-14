import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { firebaseDb, isFirebaseConfigured } from '../lib/firebaseClient.js'
import { createFirestoreSubscription, normalizeFirebaseSyncError } from './firebaseSyncUtils.js'

const journalEntriesCollection = 'journal_entries'

function normalizeJournalEntryRecord(record, id) {
  return {
    id,
    title: record.title ?? '',
    detail: record.detail ?? '',
    date: record.date ?? '',
  }
}

function buildJournalEntryPayload(entry) {
  return {
    title: entry.title,
    detail: entry.detail,
    date: entry.date,
    createdAt: entry.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export const isJournalSyncConfigured = isFirebaseConfigured

export async function listJournalEntries() {
  if (!firebaseDb || !isJournalSyncConfigured) {
    return { items: [], error: null }
  }

  try {
    const snapshot = await getDocs(
      query(collection(firebaseDb, journalEntriesCollection), orderBy('createdAt', 'desc')),
    )

    return {
      items: snapshot.docs.map((documentSnapshot) =>
        normalizeJournalEntryRecord(documentSnapshot.data(), documentSnapshot.id),
      ),
      error: null,
    }
  } catch (error) {
    return { items: [], error: normalizeFirebaseSyncError(error, 'your journal') }
  }
}

export async function createJournalEntry(entry) {
  if (!firebaseDb || !isJournalSyncConfigured) {
    return { item: entry, error: null }
  }

  try {
    const payload = buildJournalEntryPayload(entry)
    await setDoc(doc(firebaseDb, journalEntriesCollection, entry.id), payload)

    return {
      item: normalizeJournalEntryRecord(payload, entry.id),
      error: null,
    }
  } catch (error) {
    return { item: null, error: normalizeFirebaseSyncError(error, 'your journal') }
  }
}

export async function deleteJournalEntry(entryId) {
  if (!firebaseDb || !isJournalSyncConfigured) {
    return { error: null }
  }

  try {
    await deleteDoc(doc(firebaseDb, journalEntriesCollection, entryId))

    return {
      error: null,
    }
  } catch (error) {
    return {
      error: normalizeFirebaseSyncError(error, 'your journal'),
    }
  }
}

export function subscribeToJournalEntries(onItemsChange, onError) {
  if (!firebaseDb || !isJournalSyncConfigured) {
    return () => {}
  }

  return createFirestoreSubscription({
    queryRef: query(collection(firebaseDb, journalEntriesCollection), orderBy('createdAt', 'desc')),
    resourceLabel: 'your journal',
    loadLatest: listJournalEntries,
    onData: ({ items }) => onItemsChange(items),
    onError,
  })
}