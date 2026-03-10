import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import {
  createResilientRealtimeSubscription,
  normalizeSupabaseSyncError,
  retrySupabaseOperation,
} from './supabaseSyncUtils.js'

const journalEntriesTable = 'journal_entries'

function normalizeJournalEntryRow(row) {
  return {
    id: row.id,
    title: row.title ?? '',
    detail: row.detail ?? '',
    date: row.entry_date ?? '',
  }
}

function buildJournalEntryPayload(entry) {
  return {
    id: entry.id,
    title: entry.title,
    detail: entry.detail,
    entry_date: entry.date,
  }
}

export const isJournalSyncConfigured = isSupabaseConfigured

export async function listJournalEntries() {
  if (!supabase || !isJournalSyncConfigured) {
    return { items: [], error: null }
  }

  try {
    const { data, error } = await retrySupabaseOperation(
      async () =>
        supabase
          .from(journalEntriesTable)
          .select('id, title, detail, entry_date, created_at')
          .order('created_at', { ascending: false }),
      supabase,
    )

    if (error) {
      return { items: [], error: normalizeSupabaseSyncError(error, 'your journal') }
    }

    return {
      items: data.map(normalizeJournalEntryRow),
      error: null,
    }
  } catch (error) {
    return { items: [], error: normalizeSupabaseSyncError(error, 'your journal') }
  }
}

export async function createJournalEntry(entry) {
  if (!supabase || !isJournalSyncConfigured) {
    return { item: entry, error: null }
  }

  try {
    const { data, error } = await retrySupabaseOperation(
      async () =>
        supabase
          .from(journalEntriesTable)
          .insert(buildJournalEntryPayload(entry))
          .select('id, title, detail, entry_date, created_at')
          .single(),
      supabase,
    )

    if (error) {
      return { item: null, error: normalizeSupabaseSyncError(error, 'your journal') }
    }

    return {
      item: normalizeJournalEntryRow(data),
      error: null,
    }
  } catch (error) {
    return { item: null, error: normalizeSupabaseSyncError(error, 'your journal') }
  }
}

export async function deleteJournalEntry(entryId) {
  if (!supabase || !isJournalSyncConfigured) {
    return { error: null }
  }

  try {
    const { error } = await retrySupabaseOperation(
      async () => supabase.from(journalEntriesTable).delete().eq('id', entryId),
      supabase,
    )

    return {
      error: error ? normalizeSupabaseSyncError(error, 'your journal') : null,
    }
  } catch (error) {
    return {
      error: normalizeSupabaseSyncError(error, 'your journal'),
    }
  }
}

export function subscribeToJournalEntries(onItemsChange, onError) {
  if (!supabase || !isJournalSyncConfigured) {
    return () => {}
  }

  return createResilientRealtimeSubscription({
    supabaseClient: supabase,
    channelName: 'journal-entries-sync',
    table: journalEntriesTable,
    resourceLabel: 'your journal',
    loadLatest: listJournalEntries,
    onData: ({ items }) => onItemsChange(items),
    onError,
  })
}