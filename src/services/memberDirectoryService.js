import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import { normalizeSupabaseSyncError, retrySupabaseOperation } from './supabaseSyncUtils.js'

const memberAccountsTable = 'member_accounts'
const validRoles = new Set(['member', 'intercessor', 'pastor', 'prayer-core'])

function normalizeRole(role) {
  return validRoles.has(role) ? role : 'member'
}

function normalizeMemberAccountRow(row) {
  return {
    userId: row.user_id,
    email: row.email ?? '',
    role: normalizeRole(row.role),
    fullName: row.full_name ?? '',
    displayName: row.display_name ?? '',
    phone: row.phone ?? '',
    address: row.address ?? '',
    churchName: row.church_name ?? '',
    pastorName: row.pastor_name ?? '',
    bio: row.bio ?? '',
    avatarUrl: row.avatar_url ?? '',
    updatedAt: row.updated_at ?? null,
  }
}

function buildMemberAccountPayload({ userId, email, role, memberProfile }) {
  return {
    user_id: userId,
    email: email ?? '',
    role: normalizeRole(role),
    full_name: memberProfile.fullName ?? '',
    display_name: memberProfile.displayName ?? '',
    phone: memberProfile.phone ?? '',
    address: memberProfile.address ?? '',
    church_name: memberProfile.churchName ?? '',
    pastor_name: memberProfile.pastorName ?? '',
    bio: memberProfile.bio ?? '',
    avatar_url: memberProfile.avatarUrl ?? '',
  }
}

export const isMemberDirectoryConfigured = isSupabaseConfigured

export async function getMemberAccount(userId) {
  if (!supabase || !isMemberDirectoryConfigured || !userId) {
    return { item: null, error: null }
  }

  try {
    const { data, error } = await retrySupabaseOperation(
      async () =>
        supabase
          .from(memberAccountsTable)
          .select('user_id, email, role, full_name, display_name, phone, address, church_name, pastor_name, bio, avatar_url, updated_at')
          .eq('user_id', userId)
          .maybeSingle(),
      supabase,
    )

    if (error) {
      return { item: null, error: normalizeSupabaseSyncError(error, 'registered members') }
    }

    return {
      item: data ? normalizeMemberAccountRow(data) : null,
      error: null,
    }
  } catch (error) {
    return { item: null, error: normalizeSupabaseSyncError(error, 'registered members') }
  }
}

export async function upsertMemberAccount(memberAccount) {
  if (!supabase || !isMemberDirectoryConfigured) {
    return { item: memberAccount, error: null }
  }

  try {
    const { data, error } = await retrySupabaseOperation(
      async () =>
        supabase
          .from(memberAccountsTable)
          .upsert(buildMemberAccountPayload(memberAccount), { onConflict: 'user_id' })
          .select('user_id, email, role, full_name, display_name, phone, address, church_name, pastor_name, bio, avatar_url, updated_at')
          .single(),
      supabase,
    )

    if (error) {
      return { item: null, error: normalizeSupabaseSyncError(error, 'registered members') }
    }

    return {
      item: normalizeMemberAccountRow(data),
      error: null,
    }
  } catch (error) {
    return { item: null, error: normalizeSupabaseSyncError(error, 'registered members') }
  }
}

export async function listMemberAccounts() {
  if (!supabase || !isMemberDirectoryConfigured) {
    return { items: [], error: null }
  }

  try {
    const { data, error } = await retrySupabaseOperation(
      async () =>
        supabase
          .from(memberAccountsTable)
          .select('user_id, email, role, full_name, display_name, phone, address, church_name, pastor_name, bio, avatar_url, updated_at')
          .order('updated_at', { ascending: false }),
      supabase,
    )

    if (error) {
      return { items: [], error: normalizeSupabaseSyncError(error, 'registered members') }
    }

    return {
      items: data.map(normalizeMemberAccountRow),
      error: null,
    }
  } catch (error) {
    return { items: [], error: normalizeSupabaseSyncError(error, 'registered members') }
  }
}

export async function updateMemberAccountRole(userId, role) {
  if (!supabase || !isMemberDirectoryConfigured) {
    return { item: { userId, role: normalizeRole(role) }, error: null }
  }

  try {
    const { data, error } = await retrySupabaseOperation(
      async () =>
        supabase
          .from(memberAccountsTable)
          .update({ role: normalizeRole(role) })
          .eq('user_id', userId)
          .select('user_id, email, role, full_name, display_name, phone, address, church_name, pastor_name, bio, avatar_url, updated_at')
          .single(),
      supabase,
    )

    if (error) {
      return { item: null, error: normalizeSupabaseSyncError(error, 'registered members') }
    }

    return {
      item: normalizeMemberAccountRow(data),
      error: null,
    }
  } catch (error) {
    return { item: null, error: normalizeSupabaseSyncError(error, 'registered members') }
  }
}