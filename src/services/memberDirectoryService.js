import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { firebaseDb, isFirebaseConfigured } from '../lib/firebaseClient.js'
import { normalizeFirebaseSyncError } from './firebaseSyncUtils.js'

const memberAccountsCollection = 'member_accounts'
const validRoles = new Set(['member', 'intercessor', 'pastor', 'prayer-core'])

function normalizeRole(role) {
  if (role === 'owner') {
    return 'prayer-core'
  }

  return validRoles.has(role) ? role : 'member'
}

function normalizeMemberAccountRecord(record, userId) {
  return {
    userId,
    email: record.email ?? '',
    role: normalizeRole(record.role),
    fullName: record.fullName ?? '',
    displayName: record.displayName ?? '',
    phone: record.phone ?? '',
    address: record.address ?? '',
    churchName: record.churchName ?? '',
    pastorName: record.pastorName ?? '',
    bio: record.bio ?? '',
    avatarUrl: record.avatarUrl ?? '',
    updatedAt: record.updatedAt ?? null,
  }
}

function buildMemberAccountPayload({ userId, email, role, memberProfile }) {
  return {
    userId,
    email: email ?? '',
    role: normalizeRole(role),
    fullName: memberProfile.fullName ?? '',
    displayName: memberProfile.displayName ?? '',
    phone: memberProfile.phone ?? '',
    address: memberProfile.address ?? '',
    churchName: memberProfile.churchName ?? '',
    pastorName: memberProfile.pastorName ?? '',
    bio: memberProfile.bio ?? '',
    avatarUrl: memberProfile.avatarUrl ?? '',
    updatedAt: new Date().toISOString(),
  }
}

export const isMemberDirectoryConfigured = isFirebaseConfigured

export async function getMemberAccount(userId) {
  if (!firebaseDb || !isMemberDirectoryConfigured || !userId) {
    return { item: null, error: null }
  }

  try {
    const snapshot = await getDoc(doc(firebaseDb, memberAccountsCollection, userId))

    return {
      item: snapshot.exists() ? normalizeMemberAccountRecord(snapshot.data(), snapshot.id) : null,
      error: null,
    }
  } catch (error) {
    return { item: null, error: normalizeFirebaseSyncError(error, 'registered members') }
  }
}

export async function upsertMemberAccount(memberAccount) {
  if (!firebaseDb || !isMemberDirectoryConfigured) {
    return { item: memberAccount, error: null }
  }

  try {
    const payload = buildMemberAccountPayload(memberAccount)
    const userId = memberAccount.userId ?? payload.userId

    await setDoc(doc(firebaseDb, memberAccountsCollection, userId), payload, { merge: true })

    return {
      item: normalizeMemberAccountRecord(payload, userId),
      error: null,
    }
  } catch (error) {
    return { item: null, error: normalizeFirebaseSyncError(error, 'registered members') }
  }
}

export async function listMemberAccounts() {
  if (!firebaseDb || !isMemberDirectoryConfigured) {
    return { items: [], error: null }
  }

  try {
    const snapshot = await getDocs(
      query(collection(firebaseDb, memberAccountsCollection), orderBy('updatedAt', 'desc')),
    )

    return {
      items: snapshot.docs.map((documentSnapshot) =>
        normalizeMemberAccountRecord(documentSnapshot.data(), documentSnapshot.id),
      ),
      error: null,
    }
  } catch (error) {
    return { items: [], error: normalizeFirebaseSyncError(error, 'registered members') }
  }
}

export async function updateMemberAccountRole(userId, role) {
  if (!firebaseDb || !isMemberDirectoryConfigured) {
    return { item: { userId, role: normalizeRole(role) }, error: null }
  }

  try {
    const documentRef = doc(firebaseDb, memberAccountsCollection, userId)
    const existingSnapshot = await getDoc(documentRef)
    const nextRecord = {
      ...(existingSnapshot.exists() ? existingSnapshot.data() : { userId }),
      role: normalizeRole(role),
      updatedAt: new Date().toISOString(),
    }

    await setDoc(documentRef, nextRecord, { merge: true })

    return {
      item: normalizeMemberAccountRecord(nextRecord, userId),
      error: null,
    }
  } catch (error) {
    return { item: null, error: normalizeFirebaseSyncError(error, 'registered members') }
  }
}