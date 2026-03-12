import { createClient } from '@supabase/supabase-js'
import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { config as loadEnvFile } from 'dotenv'
import fs from 'node:fs/promises'

loadEnvFile({ path: '.env' })
loadEnvFile({ path: '.env.local', override: true })

const validRoles = new Set(['member', 'intercessor', 'pastor', 'prayer-core'])
const authPageSize = 100
const tablePageSize = 1000
const firestoreBatchLimit = 400

const memberAccountColumns =
  'user_id,email,role,full_name,display_name,phone,address,church_name,pastor_name,bio,avatar_url,updated_at'
const prayerRequestColumns =
  'id,label,completed,answered_at,answered_note,requested_by,is_anonymous,workflow_status,category,confidentiality,submitted_by,assigned_to,flagged_at,prayed_at,owner_user_id,visibility_scope,follow_up_status,follow_up_messages,prayed_notice,prayed_notified_at,prayed_by,testimony_text,testimony_shared,created_at'
const legacyPrayerRequestColumns =
  'id,label,completed,answered_at,answered_note,requested_by,is_anonymous,workflow_status,category,confidentiality,submitted_by,assigned_to,flagged_at,prayed_at,created_at'
const journalEntryColumns = 'id,user_id,title,detail,entry_date,created_at'
const dailyTeachingColumns = 'id,publish_date,title,speaker,theme,summary,source,link'

function parseArgs(argv) {
  const args = {}

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]

    if (!current.startsWith('--')) {
      continue
    }

    const key = current.slice(2)
    const value = argv[index + 1]

    if (!value || value.startsWith('--')) {
      args[key] = true
      continue
    }

    args[key] = value
    index += 1
  }

  return args
}

function printUsage() {
  console.log(`Usage:
  npm run migrate:supabase -- --default-password "TempPass123!"

Required source environment:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Required target environment:
  Either GOOGLE_APPLICATION_CREDENTIALS
  or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

Optional flags:
  --default-password "TempPass123!"
  --skip-auth
  --skip-member-accounts
  --skip-prayer-requests
  --skip-journal-entries
  --skip-daily-teachings
  --report-file migration-report.json`)
}

function normalizeRole(role) {
  if (role === 'owner') {
    return 'prayer-core'
  }

  return validRoles.has(role) ? role : 'member'
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp()
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  })
}

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function fetchAllTableRows(label, loadPage) {
  const rows = []
  let offset = 0

  while (true) {
    const { data, error } = await loadPage(offset, tablePageSize)

    if (error) {
      throw new Error(`Failed to fetch ${label}: ${error.message}`)
    }

    if (!Array.isArray(data) || data.length === 0) {
      break
    }

    rows.push(...data)

    if (data.length < tablePageSize) {
      break
    }

    offset += tablePageSize
  }

  return rows
}

async function listSupabaseUsers(supabase) {
  const users = []
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: authPageSize,
    })

    if (error) {
      throw new Error(`Failed to list Supabase auth users: ${error.message}`)
    }

    const pageUsers = data?.users ?? []
    users.push(...pageUsers)

    if (pageUsers.length < authPageSize) {
      break
    }

    page += 1
  }

  return users
}

function buildMemberProfileFromRow(row) {
  return {
    fullName: row.full_name ?? '',
    displayName: row.display_name ?? '',
    phone: row.phone ?? '',
    address: row.address ?? '',
    churchName: row.church_name ?? '',
    pastorName: row.pastor_name ?? '',
    bio: row.bio ?? '',
    avatarUrl: row.avatar_url ?? '',
  }
}

async function migrateAuthUsers({ supabase, firebaseAuth, defaultPassword, memberAccountsBySupabaseId }) {
  const supabaseUsers = await listSupabaseUsers(supabase)
  const uidMap = new Map()
  const skippedUsers = []

  for (const user of supabaseUsers) {
    const email = normalizeEmail(user.email)

    if (!email) {
      skippedUsers.push({ supabaseUserId: user.id, reason: 'missing email address' })
      continue
    }

    const memberAccount = memberAccountsBySupabaseId.get(user.id)
    const memberProfile = memberAccount ? buildMemberProfileFromRow(memberAccount) : null
    const displayName =
      memberProfile?.displayName ||
      memberProfile?.fullName ||
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      null
    const role = normalizeRole(
      user.app_metadata?.role ?? user.user_metadata?.role ?? memberAccount?.role ?? 'member',
    )

    let firebaseUser

    try {
      firebaseUser = await firebaseAuth.getUserByEmail(email)
      firebaseUser = await firebaseAuth.updateUser(firebaseUser.uid, {
        email,
        password: defaultPassword,
        displayName,
        emailVerified: Boolean(user.email_confirmed_at),
        disabled: false,
      })
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error
      }

      firebaseUser = await firebaseAuth.createUser({
        email,
        password: defaultPassword,
        displayName,
        emailVerified: Boolean(user.email_confirmed_at),
        disabled: false,
      })
    }

    uidMap.set(user.id, firebaseUser.uid)
    await firebaseAuth.setCustomUserClaims(firebaseUser.uid, { role })
  }

  return {
    uidMap,
    skippedUsers,
    migratedCount: uidMap.size,
  }
}

function chunkItems(items, size) {
  const chunks = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

async function writeDocumentsInBatches(firestore, collectionName, records) {
  for (const chunk of chunkItems(records, firestoreBatchLimit)) {
    const batch = firestore.batch()

    for (const record of chunk) {
      batch.set(firestore.collection(collectionName).doc(record.id), record.data, { merge: true })
    }

    await batch.commit()
  }
}

function resolveTargetUserId(sourceUserId, uidMap, skipAuth) {
  if (!sourceUserId) {
    return null
  }

  if (uidMap.has(sourceUserId)) {
    return uidMap.get(sourceUserId)
  }

  return skipAuth ? sourceUserId : null
}

async function loadMemberAccounts(supabase) {
  return fetchAllTableRows('member_accounts', (offset, pageSize) =>
    supabase
      .from('member_accounts')
      .select(memberAccountColumns)
      .range(offset, offset + pageSize - 1),
  )
}

async function loadPrayerRequests(supabase) {
  const fullResult = await fetchAllTableRows('prayer_requests', (offset, pageSize) =>
    supabase
      .from('prayer_requests')
      .select(prayerRequestColumns)
      .range(offset, offset + pageSize - 1),
  ).catch(async (error) => {
    if (!String(error.message).includes('prayer_requests')) {
      throw error
    }

    return fetchAllTableRows('legacy prayer_requests', (offset, pageSize) =>
      supabase
        .from('prayer_requests')
        .select(legacyPrayerRequestColumns)
        .range(offset, offset + pageSize - 1),
    )
  })

  return fullResult
}

async function loadJournalEntries(supabase) {
  return fetchAllTableRows('journal_entries', (offset, pageSize) =>
    supabase
      .from('journal_entries')
      .select(journalEntryColumns)
      .range(offset, offset + pageSize - 1),
  )
}

async function loadDailyTeachings(supabase) {
  return fetchAllTableRows('daily_teachings', (offset, pageSize) =>
    supabase
      .from('daily_teachings')
      .select(dailyTeachingColumns)
      .range(offset, offset + pageSize - 1),
  )
}

function mapMemberAccounts(rows, uidMap, skipAuth) {
  const skipped = []
  const records = []

  for (const row of rows) {
    const userId = resolveTargetUserId(row.user_id, uidMap, skipAuth)

    if (!userId) {
      skipped.push({ sourceId: row.user_id, reason: 'missing Firebase UID mapping' })
      continue
    }

    records.push({
      id: userId,
      data: {
        userId,
        email: normalizeEmail(row.email),
        role: normalizeRole(row.role),
        fullName: row.full_name ?? '',
        displayName: row.display_name ?? '',
        phone: row.phone ?? '',
        address: row.address ?? '',
        churchName: row.church_name ?? '',
        pastorName: row.pastor_name ?? '',
        bio: row.bio ?? '',
        avatarUrl: row.avatar_url ?? '',
        updatedAt: row.updated_at ?? new Date().toISOString(),
      },
    })
  }

  return { records, skipped }
}

function mapPrayerRequests(rows, uidMap, skipAuth) {
  return rows.map((row) => ({
    id: row.id,
    data: {
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
      ownerUserId: resolveTargetUserId(row.owner_user_id, uidMap, skipAuth),
      visibilityScope: row.visibility_scope ?? 'team',
      followUpStatus: row.follow_up_status ?? 'none',
      followUpMessages: Array.isArray(row.follow_up_messages) ? row.follow_up_messages : [],
      prayedNotice: row.prayed_notice ?? '',
      prayedNotifiedAt: row.prayed_notified_at ?? null,
      prayedBy: row.prayed_by ?? '',
      testimonyText: row.testimony_text ?? '',
      testimonyShared: Boolean(row.testimony_shared),
      createdAt: row.created_at ?? new Date().toISOString(),
      updatedAt: row.created_at ?? new Date().toISOString(),
    },
  }))
}

function mapJournalEntries(rows, uidMap, skipAuth) {
  const skipped = []
  const records = []

  for (const row of rows) {
    const userId = resolveTargetUserId(row.user_id, uidMap, skipAuth)

    if (!userId) {
      skipped.push({ sourceId: row.id, reason: 'missing Firebase UID mapping' })
      continue
    }

    records.push({
      id: row.id,
      data: {
        userId,
        title: row.title ?? '',
        detail: row.detail ?? '',
        date: row.entry_date ?? '',
        createdAt: row.created_at ?? new Date().toISOString(),
        updatedAt: row.created_at ?? new Date().toISOString(),
      },
    })
  }

  return { records, skipped }
}

function mapDailyTeachings(rows) {
  return rows.map((row) => ({
    id: row.publish_date ?? row.id,
    data: {
      publishDate: row.publish_date,
      title: row.title ?? '',
      speaker: row.speaker ?? '',
      theme: row.theme ?? '',
      summary: row.summary ?? '',
      source: row.source ?? 'Firebase teaching feed',
      link: row.link ?? null,
      updatedAt: new Date().toISOString(),
    },
  }))
}

async function writeReport(reportFile, summary) {
  if (!reportFile) {
    return
  }

  await fs.writeFile(reportFile, JSON.stringify(summary, null, 2), 'utf8')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printUsage()
    return
  }

  const skipAuth = Boolean(args['skip-auth'])
  const skipMemberAccounts = Boolean(args['skip-member-accounts'])
  const skipPrayerRequests = Boolean(args['skip-prayer-requests'])
  const skipJournalEntries = Boolean(args['skip-journal-entries'])
  const skipDailyTeachings = Boolean(args['skip-daily-teachings'])
  const defaultPassword = typeof args['default-password'] === 'string' ? args['default-password'] : ''
  const reportFile = typeof args['report-file'] === 'string' ? args['report-file'] : ''

  if (!skipAuth && !defaultPassword) {
    printUsage()
    throw new Error('Provide --default-password when migrating auth users.')
  }

  const supabase = createSupabaseAdminClient()
  const firebaseApp = getAdminApp()
  const firebaseAuth = getAuth(firebaseApp)
  const firestore = getFirestore(firebaseApp)

  const memberAccounts = await loadMemberAccounts(supabase)
  const memberAccountsBySupabaseId = new Map(memberAccounts.map((row) => [row.user_id, row]))
  const authSummary = skipAuth
    ? { uidMap: new Map(), skippedUsers: [], migratedCount: 0 }
    : await migrateAuthUsers({
        supabase,
        firebaseAuth,
        defaultPassword,
        memberAccountsBySupabaseId,
      })

  const summary = {
    authUsersMigrated: authSummary.migratedCount,
    memberAccountsMigrated: 0,
    prayerRequestsMigrated: 0,
    journalEntriesMigrated: 0,
    dailyTeachingsMigrated: 0,
    skippedAuthUsers: authSummary.skippedUsers,
    skippedMemberAccounts: [],
    skippedJournalEntries: [],
  }

  if (!skipMemberAccounts) {
    const mappedMemberAccounts = mapMemberAccounts(memberAccounts, authSummary.uidMap, skipAuth)
    await writeDocumentsInBatches(firestore, 'member_accounts', mappedMemberAccounts.records)
    summary.memberAccountsMigrated = mappedMemberAccounts.records.length
    summary.skippedMemberAccounts = mappedMemberAccounts.skipped
  }

  if (!skipPrayerRequests) {
    const prayerRequests = await loadPrayerRequests(supabase)
    const mappedPrayerRequests = mapPrayerRequests(prayerRequests, authSummary.uidMap, skipAuth)
    await writeDocumentsInBatches(firestore, 'prayer_requests', mappedPrayerRequests)
    summary.prayerRequestsMigrated = mappedPrayerRequests.length
  }

  if (!skipJournalEntries) {
    const journalEntries = await loadJournalEntries(supabase)
    const mappedJournalEntries = mapJournalEntries(journalEntries, authSummary.uidMap, skipAuth)
    await writeDocumentsInBatches(firestore, 'journal_entries', mappedJournalEntries.records)
    summary.journalEntriesMigrated = mappedJournalEntries.records.length
    summary.skippedJournalEntries = mappedJournalEntries.skipped
  }

  if (!skipDailyTeachings) {
    const dailyTeachings = await loadDailyTeachings(supabase)
    const mappedDailyTeachings = mapDailyTeachings(dailyTeachings)
    await writeDocumentsInBatches(firestore, 'daily_teachings', mappedDailyTeachings)
    summary.dailyTeachingsMigrated = mappedDailyTeachings.length
  }

  await writeReport(reportFile, summary)

  console.log('Migration complete.')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})