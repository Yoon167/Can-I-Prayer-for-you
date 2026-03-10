import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
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

function isRateLimitError(error) {
  const message = error?.message?.toLowerCase?.() ?? ''

  return error?.status === 429 || message.includes('rate limit') || message.includes('too many requests')
}

function normalizeSupabaseAuthError(error) {
  if (isRateLimitError(error)) {
    setAuthRateLimitCooldown()
    return getAuthRateLimitMessage()
  }

  return error?.message ?? 'Authentication is unavailable right now.'
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
  const resolvedRole = user?.app_metadata?.role ?? user?.user_metadata?.role ?? mapAccountTypeToRole(normalizedProfile.accountType)

  return {
    ...normalizedProfile,
    accountType: mapRoleToAccountType(resolvedRole),
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
  return (
    session?.user?.app_metadata?.role ??
    session?.user?.user_metadata?.role ??
    mapAccountTypeToRole(getMemberProfile(session?.user).accountType)
  )
}

export async function signInToPrayerApp({ email, password }) {
  if (isSupabaseConfigured && supabase) {
    if (!email.trim() || !password) {
      return { error: 'Enter your email and password to continue.' }
    }

    if (getAuthRateLimitUntil() > Date.now()) {
      return { error: getAuthRateLimitMessage() }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      return { error: normalizeSupabaseAuthError(error) }
    }

    clearAuthRateLimitCooldown()

    const sessionRole = getSessionRole(data.session)
    const memberProfile = getMemberProfile(data.user)

    return {
      session: buildSession(
        sessionRole,
        data.user?.email ?? '',
        'supabase',
        memberProfile,
        data.user?.id ?? '',
      ),
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

  if (!email.trim() || !password) {
    return { error: 'Enter your email and password to create an account.' }
  }

  if (isSupabaseConfigured && supabase) {
    if (getAuthRateLimitUntil() > Date.now()) {
      return { error: getAuthRateLimitMessage() }
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
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
        message: 'Account created. Sign in with your email and password to continue.',
      }
    }

    return {
      session: buildSession(role, data.user?.email ?? '', 'supabase', normalizedProfile, data.user?.id ?? ''),
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
    const { error } = await supabase.auth.signOut()

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

  const sessionRole = getSessionRole(data.session)

  if (!roleOptions.some((role) => role.id === sessionRole)) {
    return null
  }

  return buildSession(
    sessionRole,
    data.session.user?.email ?? '',
    'supabase',
    getMemberProfile(data.session.user),
    data.session.user?.id ?? '',
  )
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

  const sessionRole = user.app_metadata?.role ?? mergedMetadata.role ?? null

  return {
    error: null,
    profile: normalizedProfile,
    session: sessionRole
      ? buildSession(
          sessionRole,
          data.user?.email ?? user.email ?? '',
          'supabase',
          normalizedProfile,
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

  return () => {
    subscription.unsubscribe()
  }
}