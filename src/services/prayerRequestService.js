import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import { normalizeSupabaseSyncError } from './supabaseSyncUtils.js'

const prayerRequestsTable = 'prayer_requests'

function normalizePrayerRequestRow(row) {
  return {
    id: row.id,
    label: row.label ?? '',
    completed: Boolean(row.completed),
    answeredAt: row.answered_at ?? null,
    answeredNote: row.answered_note ?? '',
    requestedBy: row.requested_by ?? 'Community member',
    isAnonymous: Boolean(row.is_anonymous),
    workflowStatus: row.workflow_status ?? 'queue',
    category: row.category ?? 'Community care',
    confidentiality: row.confidentiality ?? 'Intercessor safe',
    submittedBy: row.submitted_by ?? 'Prayer app',
    assignedTo: row.assigned_to ?? 'Open team',
    flaggedAt: row.flagged_at ?? null,
    prayedAt: row.prayed_at ?? null,
  }
}

function buildPrayerRequestPayload(item) {
  return {
    id: item.id,
    label: item.label,
    completed: item.completed,
    answered_at: item.answeredAt,
    answered_note: item.answeredNote,
    requested_by: item.requestedBy,
    is_anonymous: item.isAnonymous,
    workflow_status: item.workflowStatus,
    category: item.category,
    confidentiality: item.confidentiality,
    submitted_by: item.submittedBy,
    assigned_to: item.assignedTo,
    flagged_at: item.flaggedAt,
    prayed_at: item.prayedAt,
  }
}

export const isPrayerRequestSyncConfigured = isSupabaseConfigured

export async function listPrayerRequests() {
  if (!supabase || !isPrayerRequestSyncConfigured) {
    return { items: [], error: null }
  }

  try {
    const { data, error } = await supabase
      .from(prayerRequestsTable)
      .select('id, label, completed, answered_at, answered_note, requested_by, is_anonymous, workflow_status, category, confidentiality, submitted_by, assigned_to, flagged_at, prayed_at, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return { items: [], error: normalizeSupabaseSyncError(error, 'prayer requests') }
    }

    return {
      items: data.map(normalizePrayerRequestRow),
      error: null,
    }
  } catch (error) {
    return { items: [], error: normalizeSupabaseSyncError(error, 'prayer requests') }
  }
}

export async function createPrayerRequest(item) {
  if (!supabase || !isPrayerRequestSyncConfigured) {
    return { item, error: null }
  }

  try {
    const { data, error } = await supabase
      .from(prayerRequestsTable)
      .insert(buildPrayerRequestPayload(item))
      .select('id, label, completed, answered_at, answered_note, requested_by, is_anonymous, workflow_status, category, confidentiality, submitted_by, assigned_to, flagged_at, prayed_at, created_at')
      .single()

    if (error) {
      return { item: null, error: normalizeSupabaseSyncError(error, 'prayer requests') }
    }

    return {
      item: normalizePrayerRequestRow(data),
      error: null,
    }
  } catch (error) {
    return { item: null, error: normalizeSupabaseSyncError(error, 'prayer requests') }
  }
}

export async function updatePrayerRequest(itemId, updates) {
  if (!supabase || !isPrayerRequestSyncConfigured) {
    return { item: { id: itemId, ...updates }, error: null }
  }

  const payload = buildPrayerRequestPayload({
    id: itemId,
    label: updates.label ?? '',
    completed: updates.completed ?? false,
    answeredAt: updates.answeredAt ?? null,
    answeredNote: updates.answeredNote ?? '',
    requestedBy: updates.requestedBy ?? 'Community member',
    isAnonymous: updates.isAnonymous ?? false,
    workflowStatus: updates.workflowStatus ?? 'queue',
    category: updates.category ?? 'Community care',
    confidentiality: updates.confidentiality ?? 'Intercessor safe',
    submittedBy: updates.submittedBy ?? 'Prayer app',
    assignedTo: updates.assignedTo ?? 'Open team',
    flaggedAt: updates.flaggedAt ?? null,
    prayedAt: updates.prayedAt ?? null,
  })

  delete payload.id

  try {
    const { data, error } = await supabase
      .from(prayerRequestsTable)
      .update(payload)
      .eq('id', itemId)
      .select('id, label, completed, answered_at, answered_note, requested_by, is_anonymous, workflow_status, category, confidentiality, submitted_by, assigned_to, flagged_at, prayed_at, created_at')
      .single()

    if (error) {
      return { item: null, error: normalizeSupabaseSyncError(error, 'prayer requests') }
    }

    return {
      item: normalizePrayerRequestRow(data),
      error: null,
    }
  } catch (error) {
    return { item: null, error: normalizeSupabaseSyncError(error, 'prayer requests') }
  }
}

export async function deletePrayerRequest(itemId) {
  if (!supabase || !isPrayerRequestSyncConfigured) {
    return { error: null }
  }

  try {
    const { error } = await supabase.from(prayerRequestsTable).delete().eq('id', itemId)

    return {
      error: error ? normalizeSupabaseSyncError(error, 'prayer requests') : null,
    }
  } catch (error) {
    return {
      error: normalizeSupabaseSyncError(error, 'prayer requests'),
    }
  }
}

export function subscribeToPrayerRequests(onItemsChange, onError) {
  if (!supabase || !isPrayerRequestSyncConfigured) {
    return () => {}
  }

  const channel = supabase
    .channel('prayer-requests-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: prayerRequestsTable },
      async () => {
        const { items, error } = await listPrayerRequests()

        if (error) {
          onError?.(error)
          return
        }

        onItemsChange(items)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}