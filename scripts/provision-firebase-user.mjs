import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { config as loadEnvFile } from 'dotenv'

loadEnvFile({ path: '.env' })
loadEnvFile({ path: '.env.local', override: true })

const validRoles = new Set(['intercessor', 'pastor', 'prayer-core'])

function normalizeRole(role) {
  if (role === 'owner') {
    return 'prayer-core'
  }

  return validRoles.has(role) ? role : 'member'
}

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
  npm run provision:user -- --email user@church.org --password "StrongPass123!" --role intercessor

Required environment:
  Either GOOGLE_APPLICATION_CREDENTIALS
  or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

Allowed roles:
  intercessor
  pastor
  prayer-core

This command also syncs Firestore member_accounts so promoted users can see pastor and analytics data immediately.`)
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

async function upsertMemberAccount(firestore, { userId, email, role }) {
  await firestore.collection('member_accounts').doc(userId).set(
    {
      userId,
      email,
      role: normalizeRole(role),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const email = typeof args.email === 'string' ? args.email.trim().toLowerCase() : ''
  const password = typeof args.password === 'string' ? args.password : ''
  const role = typeof args.role === 'string' ? args.role.trim() : ''

  if (args.help) {
    printUsage()
    return
  }

  if (!email || !password || !role) {
    printUsage()
    throw new Error('Missing one or more required arguments: --email, --password, --role')
  }

  if (!validRoles.has(role)) {
    throw new Error(`Invalid role "${role}". Use intercessor, pastor, or prayer-core.`)
  }

  const app = getAdminApp()
  const auth = getAuth(app)
  const firestore = getFirestore(app)

  let user = null

  try {
    user = await auth.getUserByEmail(email)
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error
    }
  }

  if (user) {
    const updatedUser = await auth.updateUser(user.uid, {
      email,
      password,
      emailVerified: true,
    })

    await upsertMemberAccount(firestore, {
      userId: updatedUser.uid,
      email,
      role,
    })

    console.log(`Updated user ${email} with role ${role} and synced member_accounts.`)
    return
  }

  const createdUser = await auth.createUser({
    email,
    password,
    emailVerified: true,
  })

  await upsertMemberAccount(firestore, {
    userId: createdUser.uid,
    email,
    role,
  })

  console.log(`Created user ${email} with role ${role} and synced member_accounts.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
