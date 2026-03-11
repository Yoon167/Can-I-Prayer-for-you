import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { getMemberAccount, upsertMemberAccount } from './memberDirectoryService.js'
import { formatAnsweredDate } from '../utils/prayerAppUtils.js'

const localAccountsStorageKey = 'prayer-app-local-accounts'
const authRateLimitStorageKey = 'prayer-app-auth-rate-limit-until'
const authRateLimitCooldownMs = 60 * 1000

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

function getSupabaseEmailRedirectUrl() {
  if (typeof window === 'undefined') {
    return undefined
  }

  const redirectUrl = new URL(window.location.href)
  redirectUrl.search = ''
  redirectUrl.hash = ''
  return redirectUrl.toString()
}

function clearSupabaseAuthUrlParams() {
  if (typeof window === 'undefined') {
    return
  }

  const nextUrl = new URL(window.location.href)
  nextUrl.searchParams.delete('token_hash')
  nextUrl.searchParams.delete('type')
  nextUrl.searchParams.delete('error')
  nextUrl.searchParams.delete('error_code')
  nextUrl.searchParams.delete('error_description')

  window.history.replaceState({}, document.title, nextUrl.toString())
}

function normalizeSupabaseUrlMessage(rawMessage, fallbackMessage) {
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

function normalizeSupabaseAuthError(error) {
  if (isRateLimitError(error)) {
    setAuthRateLimitCooldown()
    return getAuthRateLimitMessage()
  }

  if (isEmailConfirmationError(error)) {
    return 'Your email is not confirmed yet. Open the confirmation email, or resend it below.'
  }

  if ((error?.message?.toLowerCase?.() ?? '').includes('email address not authorized')) {
    return 'Supabase could not send the confirmation email. If you are testing, add the address to your Supabase team or finish enabling custom SMTP.'
  }

  return error?.message ?? 'Authentication is unavailable right now.'
}

export async function completePrayerAppEmailConfirmationFromUrl() {
  if (!isSupabaseConfigured || !supabase || typeof window === 'undefined') {
    return { handled: false }
  }

  const currentUrl = new URL(window.location.href)
  const tokenHash = currentUrl.searchParams.get('token_hash')
  const verificationType = currentUrl.searchParams.get('type')
  const authError = currentUrl.searchParams.get('error')
  const authErrorDescription = currentUrl.searchParams.get('error_description')

  if (authError || authErrorDescription) {
    clearSupabaseAuthUrlParams()
    return {
      handled: true,
      error: normalizeSupabaseUrlMessage(
        authErrorDescription,
        'The email confirmation link could not be completed. Request a fresh confirmation email and try again.',
      ),
    }
  }

  if (!tokenHash || !verificationType) {
    return { handled: false }
  }

  if (!['signup', 'invite', 'email', 'email_change'].includes(verificationType)) {
    return { handled: false }
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: verificationType,
  })

  clearSupabaseAuthUrlParams()

  if (error) {
    return {
      handled: true,
      error: normalizeSupabaseAuthError(error),
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

async function syncSupabaseMemberContext(user) {
  const fallbackProfile = getMemberProfile(user)
  const fallbackRole = normalizePrayerAppRole(
    user?.app_metadata?.role ?? user?.user_metadata?.role ?? mapAccountTypeToRole(fallbackProfile.accountType),
  )

  let memberAccount = null

  try {
    const { item } = await getMemberAccount(user?.id)
    memberAccount = item
  } catch {
    memberAccount = null
  }

  const resolvedRole = normalizePrayerAppRole(memberAccount?.role ?? fallbackRole)
  const mergedProfile = mergeMemberProfile(fallbackProfile, memberAccount, resolvedRole)

  try {
    const { item } = await upsertMemberAccount({
      userId: user?.id ?? '',
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

async function buildSupabaseSessionFromUser(user) {
  const { role, memberProfile } = await syncSupabaseMemberContext(user)

  return buildSession(role, user?.email ?? '', 'supabase', memberProfile, user?.id ?? '')
}

export async function signInToPrayerApp({ email, password }) {
  if (isSupabaseConfigured && supabase) {
    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password) {
      return { error: 'Enter your email and password to continue.' }
    }

    if (getAuthRateLimitUntil() > Date.now()) {
      return { error: getAuthRateLimitMessage() }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })

    if (error) {
      return {
        error: normalizeSupabaseAuthError(error),
        requiresEmailConfirmation: isEmailConfirmationError(error),
      }
    }

    clearAuthRateLimitCooldown()

    return {
      session: await buildSupabaseSessionFromUser(data.user ?? data.session?.user),
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
  const trimmedEmail = email.trim()

  if (!trimmedEmail || !password) {
    return { error: 'Enter your email and password to create an account.' }
  }

  if (isSupabaseConfigured && supabase) {
    if (getAuthRateLimitUntil() > Date.now()) {
      return { error: getAuthRateLimitMessage() }
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: getSupabaseEmailRedirectUrl(),
        data: {
          role,
          memberProfile: normalizedProfile,
        },
      },
    })

    if (error) {
      return { error: normalizeSupabaseAuthError(error) }
    }

    clearAuthRateLimitCooldown()

    if (!data.session) {
      return {
        session: null,
        pendingConfirmationEmail: trimmedEmail,
        requiresEmailConfirmation: true,
        message:
          'Account created. Check your email for the confirmation link before signing in. If it does not arrive, resend it below.',
      }
    }

    return {
      session: await buildSupabaseSessionFromUser(data.user),
      message: 'Account created successfully.',
    }
  }

  const existingAccounts = loadLocalAccounts()

  if (existingAccounts.some((account) => account.email?.toLowerCase() === email.trim().toLowerCase())) {
    return { error: 'An account with that email already exists.' }
  }

  const localAccount = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    email: email.trim().toLowerCase(),
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
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signOut({ scope: 'local' })

    if (error) {
      return { error: error.message }
    }
  }

  return { error: null }
}

export async function restorePrayerAppSession(roleOptions) {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session) {
    return null
  }

  const nextSession = await buildSupabaseSessionFromUser(data.session.user)

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

  if (!isSupabaseConfigured || !supabase) {
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

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: userError?.message ?? 'Unable to load the current user.' }
  }

  const mergedMetadata = {
    ...(user.user_metadata ?? {}),
    role,
    memberProfile: normalizedProfile,
  }

  const { data, error } = await supabase.auth.updateUser({
    data: mergedMetadata,
  })

  if (error) {
    return { error: error.message }
  }

  const { item: savedAccount, error: directoryError } = await upsertMemberAccount({
    userId: user.id,
    email: data.user?.email ?? user.email ?? currentSession?.email ?? '',
    role,
    memberProfile: normalizedProfile,
  })

  const sessionRole = normalizePrayerAppRole(
    savedAccount?.role ?? user.app_metadata?.role ?? mergedMetadata.role ?? null,
  )
  const nextProfile = mergeMemberProfile(normalizedProfile, savedAccount, sessionRole ?? role)

  return {
    error: directoryError ?? null,
    profile: nextProfile,
    session: sessionRole
      ? buildSession(
          sessionRole,
          data.user?.email ?? user.email ?? '',
          'supabase',
          nextProfile,
          data.user?.id ?? user.id,
        )
      : null,
  }
}

export function subscribeToPrayerAuthChanges(roleOptions, onSessionChange) {
  if (!isSupabaseConfigured || !supabase) {
    return () => {}
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      onSessionChange(null)
      return
    }

    buildSupabaseSessionFromUser(session.user)
      .then((nextSession) => {
        if (!roleOptions.some((role) => role.id === nextSession.role)) {
          onSessionChange(null)
          return
        }

        onSessionChange(nextSession)
      })
      .catch(() => {
        const sessionRole = getSessionRole(session)

        if (!roleOptions.some((role) => role.id === sessionRole)) {
          onSessionChange(null)
          return
        }

        onSessionChange(
          buildSession(
            sessionRole,
            session.user?.email ?? '',
            'supabase',
            getMemberProfile(session.user),
            session.user?.id ?? '',
          ),
        )
      })
  })

  return () => {
    subscription.unsubscribe()
  }
}

export async function resendPrayerAppConfirmationEmail(email) {
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    return { error: 'Enter your email address before resending the confirmation email.' }
  }

  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Confirmation emails are only available when Supabase auth is configured.' }
  }

  if (getAuthRateLimitUntil() > Date.now()) {
    return { error: getAuthRateLimitMessage() }
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: trimmedEmail,
    options: {
      emailRedirectTo: getSupabaseEmailRedirectUrl(),
    },
  })

  if (error) {
    return { error: normalizeSupabaseAuthError(error) }
  }

  clearAuthRateLimitCooldown()

  return {
    message: 'Confirmation email sent. Check your inbox and spam folder for the latest message.',
  }
}