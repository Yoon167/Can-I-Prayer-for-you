import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import { normalizeSupabaseSyncError, retrySupabaseOperation } from './supabaseSyncUtils.js'

const prayerRequestsTable = 'prayer_requests'
const prayerRequestSelectColumns = 'id, label, completed, answered_at, answered_note, requested_by, is_anonymous, workflow_status, category, confidentiality, submitted_by, assigned_to, flagged_at, prayed_at, owner_user_id, visibility_scope, follow_up_status, follow_up_messages, prayed_notice, prayed_notified_at, prayed_by, testimony_text, testimony_shared, created_at'
const legacyPrayerRequestSelectColumns = 'id, label, completed, answered_at, answered_note, requested_by, is_anonymous, workflow_status, category, confidentiality, submitted_by, assigned_to, flagged_at, prayed_at, created_at'

function isLegacyPrayerRequestSchemaError(error) {
  const message = error?.message?.toLowerCase?.() ?? ''

  return (
    message.includes('owner_user_id') ||
    message.includes('visibility_scope') ||
    message.includes('follow_up_status') ||
    message.includes('follow_up_messages') ||
    message.includes('prayed_notice') ||
    message.includes('prayed_notified_at') ||
    message.includes('prayed_by') ||
    message.includes('testimony_text') ||
    message.includes('testimony_shared')
  )
}

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
    ownerUserId: row.owner_user_id ?? null,
    visibilityScope:
      row.visibility_scope ??
      ((row.confidentiality ?? '').toLowerCase().includes('pastoral') ? 'pastoral' : 'team'),
    followUpStatus: row.follow_up_status ?? 'none',
    followUpMessages: normalizeFollowUpMessages(row.follow_up_messages),
    prayedNotice: row.prayed_notice ?? '',
    prayedNotifiedAt: row.prayed_notified_at ?? null,
    prayedBy: row.prayed_by ?? '',
    testimonyText: row.testimony_text ?? '',
    testimonyShared: Boolean(row.testimony_shared),
  }
}

function buildPrayerRequestPayload(item, includeAdvancedFields = true) {
  const payload = {
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

  if (includeAdvancedFields) {
    payload.owner_user_id = item.ownerUserId ?? null
    payload.visibility_scope = item.visibilityScope ?? 'team'
    payload.follow_up_status = item.followUpStatus ?? 'none'
    payload.follow_up_messages = item.followUpMessages ?? []
    payload.prayed_notice = item.prayedNotice ?? ''
    payload.prayed_notified_at = item.prayedNotifiedAt ?? null
    payload.prayed_by = item.prayedBy ?? ''
    payload.testimony_text = item.testimonyText ?? ''
    payload.testimony_shared = item.testimonyShared ?? false
  }

  return payload
}

export const isPrayerRequestSyncConfigured = isSupabaseConfigured

export async function listPrayerRequests() {
  if (!supabase || !isPrayerRequestSyncConfigured) {
    return { items: [], error: null }
  }

  try {
    const response = await retrySupabaseOperation(async () => {
      let nextResponse = await supabase
        .from(prayerRequestsTable)
        .select(prayerRequestSelectColumns)
        .order('created_at', { ascending: false })

      if (nextResponse.error && isLegacyPrayerRequestSchemaError(nextResponse.error)) {
        nextResponse = await supabase
          .from(prayerRequestsTable)
          .select(legacyPrayerRequestSelectColumns)
          .order('created_at', { ascending: false })
      }

      return nextResponse
    }, supabase)

    const { data, error } = response

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
    const response = await retrySupabaseOperation(async () => {
      let nextResponse = await supabase
        .from(prayerRequestsTable)
        .insert(buildPrayerRequestPayload(item))
        .select(prayerRequestSelectColumns)
        .single()

      if (nextResponse.error && isLegacyPrayerRequestSchemaError(nextResponse.error)) {
        nextResponse = await supabase
          .from(prayerRequestsTable)
          .insert(buildPrayerRequestPayload(item, false))
          .select(legacyPrayerRequestSelectColumns)
          .single()
      }

      return nextResponse
    }, supabase)

    const { data, error } = response

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
    ownerUserId: updates.ownerUserId ?? null,
    visibilityScope: updates.visibilityScope ?? 'team',
    followUpStatus: updates.followUpStatus ?? 'none',
    followUpMessages: updates.followUpMessages ?? [],
    prayedNotice: updates.prayedNotice ?? '',
    prayedNotifiedAt: updates.prayedNotifiedAt ?? null,
    prayedBy: updates.prayedBy ?? '',
    testimonyText: updates.testimonyText ?? '',
    testimonyShared: updates.testimonyShared ?? false,
  })

  delete payload.id

  try {
    const response = await retrySupabaseOperation(async () => {
      let nextResponse = await supabase
        .from(prayerRequestsTable)
        .update(payload)
        .eq('id', itemId)
        .select(prayerRequestSelectColumns)
        .single()

      if (nextResponse.error && isLegacyPrayerRequestSchemaError(nextResponse.error)) {
        const legacyPayload = buildPrayerRequestPayload({ id: itemId, ...updates }, false)
        delete legacyPayload.id

        nextResponse = await supabase
          .from(prayerRequestsTable)
          .update(legacyPayload)
          .eq('id', itemId)
          .select(legacyPrayerRequestSelectColumns)
          .single()
      }

      return nextResponse
    }, supabase)

    const { data, error } = response

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
    const { error } = await retrySupabaseOperation(
      async () => supabase.from(prayerRequestsTable).delete().eq('id', itemId),
      supabase,
    )

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