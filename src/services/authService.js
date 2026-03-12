import {
  applyActionCode,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { firebaseAuth, isFirebaseConfigured } from '../lib/firebaseClient.js'
import { getMemberAccount, upsertMemberAccount } from './memberDirectoryService.js'
import { formatAnsweredDate } from '../utils/prayerAppUtils.js'

const localAccountsStorageKey = 'prayer-app-local-accounts'
const authRateLimitStorageKey = 'prayer-app-auth-rate-limit-until'
const authRateLimitCooldownMs = 60 * 1000

function normalizeEmailAddress(email) {
  return email.trim().toLowerCase()
}

function isValidEmailAddress(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPassword(password) {
  return password.length >= 6
}

function getAuthRateLimitUntil() {
  if (typeof window === 'undefined') {
    return 0
  }

  const storedValue = window.localStorage.getItem(authRateLimitStorageKey)
  const nextAllowedAt = Number(storedValue)

  return Number.isFinite(nextAllowedAt) ? nextAllowedAt : 0
}

function setAuthRateLimitCooldown() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(authRateLimitStorageKey, String(Date.now() + authRateLimitCooldownMs))
}

function clearAuthRateLimitCooldown() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(authRateLimitStorageKey)
}

function getAuthRateLimitMessage() {
  const remainingMs = getAuthRateLimitUntil() - Date.now()
  const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000))

  return `Too many sign-in attempts right now. Please wait ${remainingSeconds} seconds and try again.`
}

function getFirebaseEmailRedirectUrl() {
  if (typeof window === 'undefined') {
    return undefined
  }

  const redirectUrl = new URL(window.location.href)
  redirectUrl.search = ''
  redirectUrl.hash = ''
  return redirectUrl.toString()
}

function clearFirebaseAuthUrlParams() {
  if (typeof window === 'undefined') {
    return
  }

  const nextUrl = new URL(window.location.href)
  nextUrl.searchParams.delete('mode')
  nextUrl.searchParams.delete('oobCode')
  nextUrl.searchParams.delete('apiKey')
  nextUrl.searchParams.delete('continueUrl')
  nextUrl.searchParams.delete('lang')
  nextUrl.searchParams.delete('error')
  nextUrl.searchParams.delete('error_code')
  nextUrl.searchParams.delete('error_description')

  window.history.replaceState({}, document.title, nextUrl.toString())
}

function normalizeFirebaseUrlMessage(rawMessage, fallbackMessage) {
  if (!rawMessage) {
    return fallbackMessage
  }

  return rawMessage.replace(/\+/g, ' ')
}

function isRateLimitError(error) {
  const message = error?.message?.toLowerCase?.() ?? ''

  return error?.status === 429 || message.includes('rate limit') || message.includes('too many requests')
}

function isEmailConfirmationError(error) {
  const message = error?.message?.toLowerCase?.() ?? ''

  return (
    message.includes('email not confirmed') ||
    message.includes('email_not_confirmed') ||
    message.includes('confirm your email')
  )
}

function normalizeFirebaseAuthError(error) {
  const code = error?.code ?? ''

  if (isRateLimitError(error)) {
    setAuthRateLimitCooldown()
    return getAuthRateLimitMessage()
  }

  if (code === 'auth/email-already-in-use') {
    return 'That email is already registered. Try signing in, or use resend confirmation if the account is still waiting to be confirmed.'
  }

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'No account matched that email and password.'
  }

  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters long.'
  }

  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address to continue.'
  }

  if (isEmailConfirmationError(error) || code === 'auth/email-not-verified') {
    return 'Your email is not confirmed yet. Open the confirmation email, or resend it below.'
  }

  if (code === 'auth/too-many-requests') {
    return getAuthRateLimitMessage()
  }

  if (code === 'auth/network-request-failed') {
    return 'Authentication is unavailable right now. Check your network connection and try again.'
  }

  return error?.message ?? 'Authentication is unavailable right now.'
}

async function sendPrayerAppVerificationEmail(user) {
  await sendEmailVerification(user, {
    url: getFirebaseEmailRedirectUrl(),
    handleCodeInApp: true,
  })
}

export async function completePrayerAppEmailConfirmationFromUrl() {
  if (!isFirebaseConfigured || !firebaseAuth || typeof window === 'undefined') {
    return { handled: false }
  }

  const currentUrl = new URL(window.location.href)
  const verificationMode = currentUrl.searchParams.get('mode')
  const actionCode = currentUrl.searchParams.get('oobCode')
  const authError = currentUrl.searchParams.get('error')
  const authErrorDescription = currentUrl.searchParams.get('error_description')

  if (authError || authErrorDescription) {
    clearFirebaseAuthUrlParams()
    return {
      handled: true,
      error: normalizeFirebaseUrlMessage(
        authErrorDescription,
        'The email confirmation link could not be completed. Request a fresh confirmation email and try again.',
      ),
    }
  }

  if (!actionCode || !verificationMode) {
    return { handled: false }
  }

  if (verificationMode !== 'verifyEmail') {
    return { handled: false }
  }

  try {
    await applyActionCode(firebaseAuth, actionCode)
    clearFirebaseAuthUrlParams()
  } catch (error) {
    clearFirebaseAuthUrlParams()
    return {
      handled: true,
      error: normalizeFirebaseAuthError(error),
    }
  }

  return {
    handled: true,
    message: 'Email confirmed successfully. Finishing sign-in...',
  }
}

function loadLocalAccounts() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedValue = window.localStorage.getItem(localAccountsStorageKey)

    if (!storedValue) {
      return []
    }

    const parsedValue = JSON.parse(storedValue)
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

function saveLocalAccounts(accounts) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(localAccountsStorageKey, JSON.stringify(accounts))
}

function normalizePrayerAppRole(role) {
  if (role === 'owner') {
    return 'prayer-core'
  }

  if (role === 'pastor' || role === 'intercessor' || role === 'prayer-core') {
    return role
  }

  return 'member'
}

function mapAccountTypeToRole(accountType) {
  if (accountType === 'pastor') {
    return 'pastor'
  }

  if (accountType === 'owner') {
    return 'prayer-core'
  }

  return 'member'
}

function mapRoleToAccountType(role) {
  if (role === 'pastor') {
    return 'pastor'
  }

  if (role === 'prayer-core') {
    return 'owner'
  }

  return 'member'
}

function normalizeMemberProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return {
      fullName: '',
      displayName: '',
      phone: '',
      address: '',
      churchName: '',
      pastorName: '',
      bio: '',
      accountType: 'member',
      avatarUrl: '',
    }
  }

  return {
    fullName: typeof profile.fullName === 'string' ? profile.fullName : '',
    displayName: typeof profile.displayName === 'string' ? profile.displayName : '',
    phone: typeof profile.phone === 'string' ? profile.phone : '',
    address: typeof profile.address === 'string' ? profile.address : '',
    churchName: typeof profile.churchName === 'string' ? profile.churchName : '',
    pastorName: typeof profile.pastorName === 'string' ? profile.pastorName : '',
    bio: typeof profile.bio === 'string' ? profile.bio : '',
    accountType:
      profile.accountType === 'pastor' || profile.accountType === 'owner' ? profile.accountType : 'member',
    avatarUrl: typeof profile.avatarUrl === 'string' ? profile.avatarUrl : '',
  }
}

function getMemberProfile(user) {
  const normalizedProfile = normalizeMemberProfile(user?.user_metadata?.memberProfile)
  const resolvedRole = normalizePrayerAppRole(
    user?.app_metadata?.role ?? user?.user_metadata?.role ?? mapAccountTypeToRole(normalizedProfile.accountType),
  )

  return {
    ...normalizedProfile,
    accountType: mapRoleToAccountType(resolvedRole),
  }
}

function pickProfileValue(primaryValue, fallbackValue) {
  return typeof primaryValue === 'string' && primaryValue.trim() ? primaryValue : fallbackValue
}

function mergeMemberProfile(baseProfile, memberAccount, resolvedRole) {
  if (!memberAccount) {
    return {
      ...baseProfile,
      accountType: mapRoleToAccountType(resolvedRole),
    }
  }

  return {
    fullName: pickProfileValue(memberAccount.fullName, baseProfile.fullName),
    displayName: pickProfileValue(memberAccount.displayName, baseProfile.displayName),
    phone: pickProfileValue(memberAccount.phone, baseProfile.phone),
    address: pickProfileValue(memberAccount.address, baseProfile.address),
    churchName: pickProfileValue(memberAccount.churchName, baseProfile.churchName),
    pastorName: pickProfileValue(memberAccount.pastorName, baseProfile.pastorName),
    bio: pickProfileValue(memberAccount.bio, baseProfile.bio),
    accountType: mapRoleToAccountType(resolvedRole),
    avatarUrl: pickProfileValue(memberAccount.avatarUrl, baseProfile.avatarUrl),
  }
}

function buildSession(role, email, provider, memberProfile = normalizeMemberProfile(), userId = '') {
  return {
    role,
    email,
    provider,
    signedInAt: formatAnsweredDate(),
    memberProfile,
    userId,
  }
}

function getSessionRole(session) {
  return normalizePrayerAppRole(
    session?.user?.app_metadata?.role ??
      session?.user?.user_metadata?.role ??
      mapAccountTypeToRole(getMemberProfile(session?.user).accountType),
  )
}

async function syncFirebaseMemberContext(user) {
  const fallbackProfile = getMemberProfile(user)
  const fallbackRole = normalizePrayerAppRole(mapAccountTypeToRole(fallbackProfile.accountType))

  let memberAccount = null

  try {
    const { item } = await getMemberAccount(user?.uid)
    memberAccount = item
  } catch {
    memberAccount = null
  }

  const resolvedRole = normalizePrayerAppRole(memberAccount?.role ?? fallbackRole)
  const mergedProfile = mergeMemberProfile(fallbackProfile, memberAccount, resolvedRole)

  try {
    const { item } = await upsertMemberAccount({
      userId: user?.uid ?? '',
      email: user?.email ?? memberAccount?.email ?? '',
      role: resolvedRole,
      memberProfile: mergedProfile,
    })

    if (item) {
      return {
        role: item.role,
        memberProfile: mergeMemberProfile(mergedProfile, item, item.role),
      }
    }
  } catch {
    // Fall back to auth metadata when the member directory is not ready yet.
  }

  return {
    role: resolvedRole,
    memberProfile: mergedProfile,
  }
}

async function buildFirebaseSessionFromUser(user) {
  const { role, memberProfile } = await syncFirebaseMemberContext(user)

  return buildSession(role, user?.email ?? '', 'firebase', memberProfile, user?.uid ?? '')
}

export async function signInToPrayerApp({ email, password }) {
  if (isFirebaseConfigured && firebaseAuth) {
    const trimmedEmail = normalizeEmailAddress(email)

    if (!trimmedEmail || !password) {
      return { error: 'Enter your email and password to continue.' }
    }

    if (getAuthRateLimitUntil() > Date.now()) {
      return { error: getAuthRateLimitMessage() }
    }

    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, trimmedEmail, password)
      const user = credential.user

      if (!user.emailVerified) {
        return {
          error: normalizeFirebaseAuthError({ code: 'auth/email-not-verified' }),
          requiresEmailConfirmation: true,
        }
      }

      clearAuthRateLimitCooldown()

      return {
        session: await buildFirebaseSessionFromUser(user),
      }
    } catch (error) {
      return {
        error: normalizeFirebaseAuthError(error),
        requiresEmailConfirmation: isEmailConfirmationError(error),
      }
    }
  }

  const localAccount = loadLocalAccounts().find(
    (account) => account.email?.toLowerCase() === email.trim().toLowerCase() && account.password === password,
  )

  if (localAccount) {
    return {
      session: buildSession(
        localAccount.role,
        localAccount.email,
        'local',
        normalizeMemberProfile(localAccount.memberProfile),
        localAccount.id,
      ),
    }
  }

  if (!email.trim() || !password) {
    return { error: 'Enter your email and password to continue.' }
  }

  return { error: 'No account matched that email and password.' }
}

export async function signUpToPrayerApp({ email, password, memberProfile }) {
  const normalizedProfile = {
    ...normalizeMemberProfile(memberProfile),
    accountType: 'member',
  }
  const role = 'member'
  const trimmedEmail = normalizeEmailAddress(email)

  if (!trimmedEmail || !password) {
    return { error: 'Enter your email and password to create an account.' }
  }

  if (!isValidEmailAddress(trimmedEmail)) {
    return { error: 'Enter a valid email address to create an account.' }
  }

  if (!isValidPassword(password)) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  if (isFirebaseConfigured && firebaseAuth) {
    if (getAuthRateLimitUntil() > Date.now()) {
      return { error: getAuthRateLimitMessage() }
    }

    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, trimmedEmail, password)
      const user = credential.user

      await upsertMemberAccount({
        userId: user.uid,
        email: trimmedEmail,
        role,
        memberProfile: normalizedProfile,
      })

      await sendPrayerAppVerificationEmail(user)
      clearAuthRateLimitCooldown()

      return {
        session: null,
        pendingConfirmationEmail: trimmedEmail,
        requiresEmailConfirmation: true,
        message:
          'Account created. Check your email for the confirmation link before signing in. If it does not arrive, resend it below.',
      }
    } catch (error) {
      return { error: normalizeFirebaseAuthError(error) }
    }
  }

  const existingAccounts = loadLocalAccounts()

  if (existingAccounts.some((account) => account.email?.toLowerCase() === trimmedEmail)) {
    return { error: 'An account with that email already exists.' }
  }

  const localAccount = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    email: trimmedEmail,
    password,
    role,
    memberProfile: normalizedProfile,
  }

  saveLocalAccounts([localAccount, ...existingAccounts])

  return {
    session: buildSession(role, localAccount.email, 'local', normalizedProfile, localAccount.id),
    message: 'Account created successfully.',
  }
}

export async function signOutOfPrayerApp() {
  if (isFirebaseConfigured && firebaseAuth) {
    try {
      await signOut(firebaseAuth)
    } catch (error) {
      return { error: error.message }
    }
  }

  return { error: null }
}

export async function restorePrayerAppSession(roleOptions) {
  if (!isFirebaseConfigured || !firebaseAuth) {
    return null
  }

  const user = firebaseAuth.currentUser

  if (!user || !user.emailVerified) {
    return null
  }

  const nextSession = await buildFirebaseSessionFromUser(user)

  if (!roleOptions.some((role) => role.id === nextSession.role)) {
    return null
  }

  return nextSession
}

export async function savePrayerAppMemberProfile(profile, currentSession) {
  const preservedRole = currentSession?.role ?? 'member'
  const normalizedProfile = {
    ...normalizeMemberProfile(profile),
    accountType: mapRoleToAccountType(preservedRole),
  }
  const role = preservedRole

  if (!isFirebaseConfigured || !firebaseAuth) {
    if (currentSession?.provider === 'local' && currentSession.email) {
      const nextAccounts = loadLocalAccounts().map((account) =>
        account.email?.toLowerCase() === currentSession.email.toLowerCase()
          ? { ...account, role, memberProfile: normalizedProfile }
          : account,
      )

      saveLocalAccounts(nextAccounts)
    }

    return {
      session: buildSession(
        role,
        currentSession?.email ?? '',
        currentSession?.provider ?? 'local',
        normalizedProfile,
        currentSession?.userId ?? '',
      ),
      profile: normalizedProfile,
      error: null,
    }
  }

  const user = firebaseAuth.currentUser

  if (!user) {
    return { error: 'Unable to load the current user.' }
  }

  try {
    await updateProfile(user, {
      displayName: normalizedProfile.displayName || normalizedProfile.fullName || null,
    })
  } catch {
    // Firestore remains the source of truth for profile fields.
  }

  const { item: savedAccount, error: directoryError } = await upsertMemberAccount({
    userId: user.uid,
    email: user.email ?? currentSession?.email ?? '',
    role,
    memberProfile: normalizedProfile,
  })

  const sessionRole = normalizePrayerAppRole(savedAccount?.role ?? role)
  const nextProfile = mergeMemberProfile(normalizedProfile, savedAccount, sessionRole ?? role)

  return {
    error: directoryError ?? null,
    profile: nextProfile,
    session: sessionRole
      ? buildSession(
          sessionRole,
          user.email ?? '',
          'firebase',
          nextProfile,
          user.uid,
        )
      : null,
  }
}

export function subscribeToPrayerAuthChanges(roleOptions, onSessionChange) {
  if (!isFirebaseConfigured || !firebaseAuth) {
    return () => {}
  }

  const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
    if (!user || !user.emailVerified) {
      onSessionChange(null)
      return
    }

    buildFirebaseSessionFromUser(user)
      .then((nextSession) => {
        if (!roleOptions.some((role) => role.id === nextSession.role)) {
          onSessionChange(null)
          return
        }

        onSessionChange(nextSession)
      })
      .catch(() => {
        const sessionRole = getSessionRole({ user })

        if (!roleOptions.some((role) => role.id === sessionRole)) {
          onSessionChange(null)
          return
        }

        onSessionChange(
          buildSession(
            sessionRole,
            user.email ?? '',
            'firebase',
            getMemberProfile(user),
            user.uid ?? '',
          ),
        )
      })
  })

  return () => {
    unsubscribe()
  }
}

export async function resendPrayerAppConfirmationEmail(email) {
  const trimmedEmail = normalizeEmailAddress(email)

  if (!trimmedEmail) {
    return { error: 'Enter your email address before resending the confirmation email.' }
  }

  if (!isValidEmailAddress(trimmedEmail)) {
    return { error: 'Enter a valid email address before resending the confirmation email.' }
  }

  if (!isFirebaseConfigured || !firebaseAuth) {
    return { error: 'Confirmation emails are only available when Firebase auth is configured.' }
  }

  if (getAuthRateLimitUntil() > Date.now()) {
    return { error: getAuthRateLimitMessage() }
  }

  const currentUser = firebaseAuth.currentUser

  if (!currentUser || currentUser.email?.toLowerCase() !== trimmedEmail) {
    return {
      error:
        'Firebase can resend the verification email only for the account currently open in this browser. Sign in again with that account first.',
    }
  }

  if (currentUser.emailVerified) {
    return { message: 'This email address is already verified.' }
  }

  try {
    await sendPrayerAppVerificationEmail(currentUser)
  } catch (error) {
    return { error: normalizeFirebaseAuthError(error) }
  }

  clearAuthRateLimitCooldown()

  return {
    message: 'Confirmation email sent. Check your inbox and spam folder for the latest message.',
  }
}