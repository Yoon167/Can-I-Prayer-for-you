import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import './App.css'
import AnsweredPrayersPanel from './components/AnsweredPrayersPanel.jsx'
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx'
import BibleView from './components/BibleView.jsx'
import AppNavbar from './components/AppNavbar.jsx'
import AppLoadingScreen from './components/AppLoadingScreen.jsx'
import AuthPanel from './components/AuthPanel.jsx'
import HeroPanel from './components/HeroPanel.jsx'
import HomeView from './components/HomeView.jsx'
import JournalPanel from './components/JournalPanel.jsx'
import PastoralReviewPanel from './components/PastoralReviewPanel.jsx'
import PrayerListPanel from './components/PrayerListPanel.jsx'
import PrayerRhythmPanel from './components/PrayerRhythmPanel.jsx'
import ProfileView from './components/ProfileView.jsx'
import PraisesView from './components/PraisesView.jsx'
import SwipeQueuePanel from './components/SwipeQueuePanel.jsx'
import TeamSpacesPanels from './components/TeamSpacesPanels.jsx'
import VersePanel from './components/VersePanel.jsx'
import {
  authStorageKey,
  filterOptions,
  focusStorageKey,
  intercessorSpaces,
  journalEntries,
  journalStorageKey,
  memberProfileStorageKey,
  pastoralReviewStorageKey,
  prayedDeckStorageKey,
  prayerCoreSpaces,
  prayerFocus,
  prayerMoments,
  prayerQueueStorageKey,
  prayerSwipeDeck,
  roleOptions,
  roleStorageKey,
} from './data/dashboardData.js'
import { isSupabaseConfigured } from './lib/supabaseClient.js'
import {
  restorePrayerAppSession,
  savePrayerAppMemberProfile,
  signInToPrayerApp,
  signOutOfPrayerApp,
  signUpToPrayerApp,
  subscribeToPrayerAuthChanges,
} from './services/authService.js'
import {
  listMemberAccounts,
  updateMemberAccountRole,
} from './services/memberDirectoryService.js'
import { getDailyHomeContent } from './data/dailyContent.js'
import { getLiveHomeContent } from './services/liveContentService.js'
import {
  getFallbackTeaching,
  getFeaturedTeaching,
  isTeachingSyncConfigured,
  saveFeaturedTeaching,
  subscribeToFeaturedTeaching,
} from './services/teachingService.js'
import {
  createPrayerRequest,
  deletePrayerRequest,
  isPrayerRequestSyncConfigured,
  listPrayerRequests,
  subscribeToPrayerRequests,
  updatePrayerRequest,
} from './services/prayerRequestService.js'
import {
  createJournalEntry,
  deleteJournalEntry,
  isJournalSyncConfigured,
  listJournalEntries,
  subscribeToJournalEntries,
} from './services/journalService.js'
import { isTransientSupabaseError } from './services/supabaseSyncUtils.js'
import {
  createId,
  formatAnsweredDate,
  formatEntryDate,
  loadStoredItems,
  normalizeFocusItems,
  normalizePrayerDeck,
} from './utils/prayerAppUtils.js'

function normalizeLegacyRole(role) {
  if (role === 'owner') {
    return 'prayer-core'
  }

  return role
}

function normalizeStoredMemberProfile(profile, defaultMemberProfile) {
  if (!profile || typeof profile !== 'object') {
    return defaultMemberProfile
  }

  return {
    fullName: profile.fullName ?? '',
    displayName: profile.displayName ?? '',
    phone: profile.phone ?? '',
    address: profile.address ?? '',
    churchName: profile.churchName ?? '',
    pastorName: profile.pastorName ?? '',
    bio: profile.bio ?? '',
    accountType:
      profile.accountType === 'owner'
        ? 'owner'
        : profile.accountType === 'pastor'
          ? 'pastor'
          : 'member',
    avatarUrl: profile.avatarUrl ?? '',
  }
}

function normalizeStoredAuthSession(session, roleOptions, defaultMemberProfile) {
  if (!session || typeof session !== 'object') {
    return null
  }

  const normalizedRole = normalizeLegacyRole(session.role)

  if (!roleOptions.some((role) => role.id === normalizedRole)) {
    return null
  }

  return {
    ...session,
    role: normalizedRole,
    memberProfile: normalizeStoredMemberProfile(session.memberProfile, defaultMemberProfile),
  }
}

const defaultMemberProfile = {
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

function App() {
  const currentBuildId = import.meta.env.VITE_APP_BUILD_ID || 'dev-local'
  const [authReady, setAuthReady] = useState(() => !isSupabaseConfigured)
  const [authSession, setAuthSession] = useState(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const storedSession = window.localStorage.getItem(authStorageKey)

    if (!storedSession) {
      return null
    }

    try {
      return normalizeStoredAuthSession(JSON.parse(storedSession), roleOptions, defaultMemberProfile)
    } catch {
      return null
    }
  })
  const [selectedRole, setSelectedRole] = useState(() => {
    if (typeof window === 'undefined') {
      return roleOptions[0].id
    }

    const storedRole = window.localStorage.getItem(roleStorageKey)
    const normalizedRole = normalizeLegacyRole(storedRole)
    return roleOptions.some((role) => role.id === normalizedRole) ? normalizedRole : roleOptions[0].id
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState('sign-in')
  const [signUpForm, setSignUpForm] = useState(defaultMemberProfile)
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [currentView, setCurrentView] = useState('home')
  const [focusItems, setFocusItems] = useState(() =>
    normalizeFocusItems(loadStoredItems(focusStorageKey, prayerFocus)),
  )
  const [journalItems, setJournalItems] = useState(() =>
    loadStoredItems(journalStorageKey, journalEntries),
  )
  const [prayerQueue, setPrayerQueue] = useState(() =>
    normalizePrayerDeck(loadStoredItems(prayerQueueStorageKey, prayerSwipeDeck)),
  )
  const [pastoralReviewItems, setPastoralReviewItems] = useState(() =>
    normalizePrayerDeck(loadStoredItems(pastoralReviewStorageKey, [])),
  )
  const [prayedDeckItems, setPrayedDeckItems] = useState(() =>
    normalizePrayerDeck(loadStoredItems(prayedDeckStorageKey, [])),
  )
  const [memberProfile, setMemberProfile] = useState(() => {
    if (typeof window === 'undefined') {
      return defaultMemberProfile
    }

    const storedProfile = window.localStorage.getItem(memberProfileStorageKey)

    if (!storedProfile) {
      return defaultMemberProfile
    }

    try {
      return normalizeStoredMemberProfile(JSON.parse(storedProfile), defaultMemberProfile)
    } catch {
      return defaultMemberProfile
    }
  })
  const [focusFilter, setFocusFilter] = useState('all')
  const [requestText, setRequestText] = useState('')
  const [requestIsAnonymous, setRequestIsAnonymous] = useState(false)
  const [requestVisibilityScope, setRequestVisibilityScope] = useState('team')
  const [journalForm, setJournalForm] = useState({ title: '', detail: '' })
  const [memberProfileForm, setMemberProfileForm] = useState(() => ({
    ...memberProfile,
  }))
  const [memberProfileStatus, setMemberProfileStatus] = useState('')
  const [requestSyncStatus, setRequestSyncStatus] = useState('')
  const [requestSyncTone, setRequestSyncTone] = useState('neutral')
  const [journalSyncStatus, setJournalSyncStatus] = useState('')
  const [journalSyncTone, setJournalSyncTone] = useState('neutral')
  const [homeContent, setHomeContent] = useState(() => getDailyHomeContent())
  const [homeContentStatus, setHomeContentStatus] = useState('Loading daily devotion and teaching...')
  const [teachingForm, setTeachingForm] = useState(() => {
    const fallbackTeaching = getFallbackTeaching()

    return {
      publishDate: fallbackTeaching.publishDate,
      title: fallbackTeaching.title,
      speaker: fallbackTeaching.speaker,
      theme: fallbackTeaching.theme,
      summary: fallbackTeaching.summary,
      source: 'Supabase teaching feed',
      link: '',
    }
  })
  const [teachingStatus, setTeachingStatus] = useState('')
  const [teachingTone, setTeachingTone] = useState('neutral')
  const [memberDirectoryItems, setMemberDirectoryItems] = useState([])
  const [memberDirectoryStatus, setMemberDirectoryStatus] = useState('')
  const [memberDirectoryTone, setMemberDirectoryTone] = useState('neutral')
  const [memberDirectoryBusy, setMemberDirectoryBusy] = useState(false)
  const [lastDeckAction, setLastDeckAction] = useState('')
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [deferredQueueIds, setDeferredQueueIds] = useState([])
  const [followUpDrafts, setFollowUpDrafts] = useState({})
  const [testimonyDrafts, setTestimonyDrafts] = useState({})
  const requestInputRef = useRef(null)
  const journalTitleRef = useRef(null)
  const swipeStartXRef = useRef(null)
  const swipePointerIdRef = useRef(null)
  const authUserId = authSession?.userId ?? ''

  const applyAuthSession = useCallback((session) => {
    const normalizedSession = session
      ? normalizeStoredAuthSession(session, roleOptions, defaultMemberProfile)
      : null

    setAuthSession(normalizedSession)

    if (normalizedSession?.role) {
      setSelectedRole(normalizedSession.role)
    }

    if (normalizedSession?.provider !== 'supabase') {
      const fallbackTeaching = getFallbackTeaching()

      setHomeContent((currentContent) => ({
        ...currentContent,
        teaching: fallbackTeaching,
      }))
      setTeachingForm({
        publishDate: fallbackTeaching.publishDate,
        title: fallbackTeaching.title,
        speaker: fallbackTeaching.speaker,
        theme: fallbackTeaching.theme,
        summary: fallbackTeaching.summary,
        source: 'Supabase teaching feed',
        link: '',
      })
    }

    if (normalizedSession?.provider === 'supabase' && normalizedSession.memberProfile) {
      setMemberProfile(normalizedSession.memberProfile)
      setMemberProfileForm(normalizedSession.memberProfile)
    }
  }, [])

  function resetAuthMessages() {
    if (authError) {
      setAuthError('')
    }

    if (authNotice) {
      setAuthNotice('')
    }
  }

  function getPrayerRequestSyncMessage(error) {
    const normalizedError = error?.toLowerCase?.() ?? ''

    if (isTransientSupabaseError(error)) {
      return 'Shared request sync is temporarily reconnecting to Supabase.'
    }

    if (
      normalizedError.includes('prayer_requests') &&
      (normalizedError.includes('does not exist') || normalizedError.includes('schema cache'))
    ) {
      return 'Shared request sync is unavailable because your Supabase project is missing the latest prayer request columns. Run supabase/bootstrap.sql in Supabase SQL Editor, then sign out and sign back in.'
    }

    if (
      normalizedError.includes('row-level security') ||
      normalizedError.includes('permission denied') ||
      normalizedError.includes('forbidden')
    ) {
      return 'Shared request sync is blocked by Supabase permissions. Confirm supabase/bootstrap.sql finished successfully, then sign out and sign back in to refresh your role.'
    }

    return error
      ? `Shared request sync is unavailable: ${error}`
      : 'Shared request sync ran into a connection problem. The current screen will keep working locally.'
  }

  function getJournalSyncMessage(error) {
    if (isTransientSupabaseError(error)) {
      return 'Journal sync is temporarily reconnecting to Supabase.'
    }

    return error
      ? `Personal journal sync is unavailable: ${error}`
      : 'Personal journal sync ran into a connection problem. The current screen will keep working locally.'
  }

  function getTeachingSyncMessage(error) {
    if (isTransientSupabaseError(error)) {
      return 'Daily teaching sync is temporarily reconnecting to Supabase.'
    }

    return error
      ? `Daily teaching sync is unavailable: ${error}`
      : 'Daily teaching sync is unavailable right now, so the app is using the local teaching fallback.'
  }

  function getMemberDirectorySyncMessage(error) {
    if (isTransientSupabaseError(error)) {
      return 'Registered members are temporarily unavailable while Supabase reconnects.'
    }

    return error
      ? `Unable to load registered members: ${error}`
      : 'Registered members are unavailable right now.'
  }

  function addPrayerRequestToLocalDeck(focusItem, requesterName) {
    setPrayerQueue((currentItems) => [
      {
        id: createId('deck'),
        focusItemId: focusItem.id,
        name: requesterName,
        requestedBy: requesterName,
        isAnonymous: focusItem.isAnonymous,
        request: focusItem.label,
        category: focusItem.category,
        confidentiality: focusItem.confidentiality,
        submittedBy: focusItem.submittedBy,
        assignedTo: focusItem.assignedTo,
        flaggedAt: focusItem.flaggedAt,
        prayedAt: focusItem.prayedAt,
        ownerUserId: focusItem.ownerUserId,
        visibilityScope: focusItem.visibilityScope,
        followUpStatus: focusItem.followUpStatus,
        followUpMessages: focusItem.followUpMessages,
        prayedNotice: focusItem.prayedNotice,
        prayedNotifiedAt: focusItem.prayedNotifiedAt,
        prayedBy: focusItem.prayedBy,
        testimonyText: focusItem.testimonyText,
        testimonyShared: focusItem.testimonyShared,
      },
      ...currentItems,
    ])
  }

  function clearDeferredQueueId(itemId) {
    setDeferredQueueIds((currentIds) => currentIds.filter((entryId) => entryId !== itemId))
  }

  function deferQueueId(itemId) {
    setDeferredQueueIds((currentIds) => [...currentIds.filter((entryId) => entryId !== itemId), itemId])
  }

  function buildPrayedUpdate(item) {
    const prayedAt = formatAnsweredDate()

    return {
      ...item,
      workflowStatus: 'prayed',
      flaggedAt: item.flaggedAt,
      prayedAt,
      prayedBy: memberDisplayName,
      prayedNotice: `${memberDisplayName} and the intercessory team prayed for this request.`,
      prayedNotifiedAt: prayedAt,
    }
  }

  function updateFocusItemLocally(itemId, updater) {
    setFocusItems((currentItems) =>
      currentItems.map((item) => (item.id === itemId ? updater(item) : item)),
    )
  }

  function handleFollowUpDraftChange(itemId, value) {
    setFollowUpDrafts((currentDrafts) => ({
      ...currentDrafts,
      [itemId]: value,
    }))
  }

  async function handleAddFollowUpMessage(itemId) {
    const selectedItem = focusItems.find((item) => item.id === itemId)
    const trimmedMessage = followUpDrafts[itemId]?.trim() ?? ''

    if (!selectedItem || !trimmedMessage) {
      return
    }

    const nextMessage = {
      id: createId('follow-up'),
      text: trimmedMessage,
      authorName: memberDisplayName,
      authorRole: activeRoleConfig.label,
      senderType: selectedItem.ownerUserId === authSession?.userId ? 'requester' : 'team',
      createdAt: formatAnsweredDate(),
    }

    const nextItem = {
      ...selectedItem,
      followUpStatus: 'requested',
      followUpMessages: [...(selectedItem.followUpMessages ?? []), nextMessage],
    }

    if (sharedPrayerRequestsEnabled) {
      const { item, error } = await updatePrayerRequest(itemId, nextItem)

      if (error) {
        if (isTransientSupabaseError(error)) {
          setRequestSyncStatus('Supabase is reconnecting, so the follow-up message was not saved to Supabase yet.')
          setRequestSyncTone('neutral')
          return
        }

        setRequestSyncStatus(`Unable to send the follow-up message: ${error}`)
        setRequestSyncTone('error')
        return
      }

      updateFocusItemLocally(itemId, () => item)
      setRequestSyncStatus('Shared requests are syncing across signed-in devices.')
      setRequestSyncTone('neutral')
    } else {
      updateFocusItemLocally(itemId, () => nextItem)
    }

    setFollowUpDrafts((currentDrafts) => ({
      ...currentDrafts,
      [itemId]: '',
    }))
  }

  function handleTestimonyDraftChange(itemId, value) {
    setTestimonyDrafts((currentDrafts) => ({
      ...currentDrafts,
      [itemId]: {
        ...(currentDrafts[itemId] ?? {}),
        text: value,
      },
    }))
  }

  function handleTestimonyShareChange(itemId, shared) {
    setTestimonyDrafts((currentDrafts) => ({
      ...currentDrafts,
      [itemId]: {
        ...(currentDrafts[itemId] ?? {}),
        shared,
      },
    }))
  }

  async function handleSaveTestimony(itemId) {
    const selectedItem = focusItems.find((item) => item.id === itemId)

    if (!selectedItem) {
      return
    }

    const nextDraft = testimonyDrafts[itemId] ?? {}
    const nextItem = {
      ...selectedItem,
      testimonyText: nextDraft.text ?? selectedItem.testimonyText ?? '',
      testimonyShared: nextDraft.shared ?? selectedItem.testimonyShared ?? false,
    }

    if (sharedPrayerRequestsEnabled) {
      const { item, error } = await updatePrayerRequest(itemId, nextItem)

      if (error) {
        if (isTransientSupabaseError(error)) {
          setRequestSyncStatus('Supabase is reconnecting, so the testimony was not saved to Supabase yet.')
          setRequestSyncTone('neutral')
          return
        }

        setRequestSyncStatus(`Unable to save this testimony: ${error}`)
        setRequestSyncTone('error')
        return
      }

      updateFocusItemLocally(itemId, () => item)
      setRequestSyncStatus('Shared requests are syncing across signed-in devices.')
      setRequestSyncTone('neutral')
      return
    }

    updateFocusItemLocally(itemId, () => nextItem)
  }

  useEffect(() => {
    window.localStorage.setItem(focusStorageKey, JSON.stringify(focusItems))
  }, [focusItems])

  useEffect(() => {
    window.localStorage.setItem(journalStorageKey, JSON.stringify(journalItems))
  }, [journalItems])

  useEffect(() => {
    window.localStorage.setItem(prayerQueueStorageKey, JSON.stringify(prayerQueue))
  }, [prayerQueue])

  useEffect(() => {
    window.localStorage.setItem(pastoralReviewStorageKey, JSON.stringify(pastoralReviewItems))
  }, [pastoralReviewItems])

  useEffect(() => {
    window.localStorage.setItem(prayedDeckStorageKey, JSON.stringify(prayedDeckItems))
  }, [prayedDeckItems])

  useEffect(() => {
    window.localStorage.setItem(memberProfileStorageKey, JSON.stringify(memberProfile))
  }, [memberProfile])

  useEffect(() => {
    window.localStorage.setItem(roleStorageKey, selectedRole)
  }, [selectedRole])

  useEffect(() => {
    if (authSession) {
      const normalizedSession = normalizeStoredAuthSession(authSession, roleOptions, defaultMemberProfile)
      window.localStorage.setItem(authStorageKey, JSON.stringify(normalizedSession))
      return
    }

    window.localStorage.removeItem(authStorageKey)
  }, [authSession])

  useEffect(() => {
    const refreshMarkerKey = 'prayer-app-refreshed-build-id'
    let isMounted = true

    async function checkForPublishedUpdate() {
      try {
        const versionUrl = new URL('./version.json', window.location.href)
        versionUrl.searchParams.set('t', `${Date.now()}`)

        const response = await fetch(versionUrl.toString(), {
          cache: 'no-store',
          headers: {
            'cache-control': 'no-cache',
          },
        })

        if (!response.ok || !isMounted) {
          return
        }

        const manifest = await response.json()
        const publishedBuildId = manifest?.buildId

        if (!publishedBuildId || publishedBuildId === currentBuildId) {
          return
        }

        if (window.sessionStorage.getItem(refreshMarkerKey) === publishedBuildId) {
          return
        }

        window.sessionStorage.setItem(refreshMarkerKey, publishedBuildId)

        const nextUrl = new URL(window.location.href)
        nextUrl.searchParams.set('v', publishedBuildId)
        window.location.replace(nextUrl.toString())
      } catch {
        // Ignore version checks when the manifest cannot be reached.
      }
    }

    const initialCheckTimer = window.setTimeout(() => {
      void checkForPublishedUpdate()
    }, 3000)
    const intervalId = window.setInterval(() => {
      void checkForPublishedUpdate()
    }, 60000)
    const handleWindowFocus = () => {
      void checkForPublishedUpdate()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForPublishedUpdate()
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      window.clearTimeout(initialCheckTimer)
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentBuildId])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined
    }

    let isMounted = true

    const handleAuthRestoreFailure = () => {
      if (!isMounted) {
        return
      }

      applyAuthSession(null)
      setAuthNotice(
        'Unable to connect to Supabase right now. Check your Supabase URL, anon key, and allowed site URL, then refresh.',
      )
      setAuthReady(true)
    }

    restorePrayerAppSession(roleOptions)
      .then((session) => {
        if (!isMounted) {
          return
        }

        applyAuthSession(session)
        setAuthReady(true)
      })
      .catch(() => {
        handleAuthRestoreFailure()
      })

    let unsubscribe = () => {}

    try {
      unsubscribe = subscribeToPrayerAuthChanges(roleOptions, (session) => {
        if (!isMounted) {
          return
        }

        applyAuthSession(session)
        setAuthReady(true)
      })
    } catch {
      handleAuthRestoreFailure()
    }

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [applyAuthSession])

  useEffect(() => {
    let isMounted = true

    getLiveHomeContent()
      .then((nextContent) => {
        if (!isMounted) {
          return
        }

        setHomeContent(nextContent)

        if (nextContent.devotion.isLive) {
          setHomeContentStatus('Daily devotion is being refreshed from a live source, with teaching updated from the app library.')
          return
        }

        setHomeContentStatus(
          'Live home content is unavailable right now, so the app is showing curated daily content.',
        )
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setHomeContent(getDailyHomeContent())
        setHomeContentStatus(
          'Live home content is unavailable right now, so the app is showing curated daily content.',
        )
      })

    return () => {
      isMounted = false
    }
  }, [])

  const sharedPrayerRequestsEnabled =
    isPrayerRequestSyncConfigured && authSession?.provider === 'supabase'
  const sharedJournalEnabled = isJournalSyncConfigured && authSession?.provider === 'supabase'
  const sharedTeachingEnabled = isTeachingSyncConfigured && authSession?.provider === 'supabase'

  const refreshSharedPrayerRequests = useEffectEvent(async ({ preserveStatus = false } = {}) => {
    const { items, error } = await listPrayerRequests()

    if (error) {
      if (!preserveStatus) {
        setRequestSyncStatus(getPrayerRequestSyncMessage(error))
        setRequestSyncTone(isTransientSupabaseError(error) ? 'neutral' : 'error')
      }

      return false
    }

    setFocusItems(normalizeFocusItems(items))

    if (!preserveStatus) {
      setRequestSyncStatus('Shared requests are syncing across signed-in devices.')
      setRequestSyncTone('neutral')
    }

    return true
  })

  useEffect(() => {
    if (!sharedTeachingEnabled) {
      return undefined
    }

    let isMounted = true

    getFeaturedTeaching().then(({ item, error }) => {
      if (!isMounted) {
        return
      }

      setHomeContent((currentContent) => ({
        ...currentContent,
        teaching: item,
      }))
      setTeachingForm({
        publishDate: item.publishDate,
        title: item.title,
        speaker: item.speaker,
        theme: item.theme,
        summary: item.summary,
        source: item.source ?? 'Supabase teaching feed',
        link: item.link ?? '',
      })

      if (error) {
        setTeachingStatus(getTeachingSyncMessage(error))
        setTeachingTone(isTransientSupabaseError(error) ? 'neutral' : 'error')
      }
    })

    const unsubscribe = subscribeToFeaturedTeaching(
      (item) => {
        if (!isMounted) {
          return
        }

        setHomeContent((currentContent) => ({
          ...currentContent,
          teaching: item,
        }))
        setTeachingForm({
          publishDate: item.publishDate,
          title: item.title,
          speaker: item.speaker,
          theme: item.theme,
          summary: item.summary,
          source: item.source ?? 'Supabase teaching feed',
          link: item.link ?? '',
        })
        setTeachingStatus('Daily teaching is syncing from Supabase.')
        setTeachingTone('neutral')
      },
      (error) => {
        if (!isMounted) {
          return
        }

        setTeachingStatus(getTeachingSyncMessage(error))
        setTeachingTone(isTransientSupabaseError(error) ? 'neutral' : 'error')
      },
    )

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [sharedTeachingEnabled, authUserId])

  useEffect(() => {
    if (!sharedPrayerRequestsEnabled) {
      return undefined
    }

    let isMounted = true
    let refreshTimer = null
    let initialRefreshTimer = null

    initialRefreshTimer = window.setTimeout(() => {
      if (!isMounted) {
        return
      }

      refreshSharedPrayerRequests()
    }, 0)

    const handleWindowFocus = () => {
      if (!isMounted) {
        return
      }

      refreshSharedPrayerRequests({ preserveStatus: true })
    }

    const unsubscribe = subscribeToPrayerRequests(
      (items) => {
        if (!isMounted) {
          return
        }

        setFocusItems(normalizeFocusItems(items))
        setRequestSyncStatus('Shared requests are syncing across signed-in devices.')
        setRequestSyncTone('neutral')
      },
      (error) => {
        if (!isMounted) {
          return
        }

        setRequestSyncStatus(getPrayerRequestSyncMessage(error))
        setRequestSyncTone(isTransientSupabaseError(error) ? 'neutral' : 'error')
      },
    )

    refreshTimer = window.setInterval(() => {
      if (!isMounted) {
        return
      }

      refreshSharedPrayerRequests({ preserveStatus: true })
    }, 15000)

    window.addEventListener('focus', handleWindowFocus)

    return () => {
      isMounted = false
      if (initialRefreshTimer) {
        window.clearTimeout(initialRefreshTimer)
      }
      if (refreshTimer) {
        window.clearInterval(refreshTimer)
      }
      window.removeEventListener('focus', handleWindowFocus)
      unsubscribe()
    }
  }, [sharedPrayerRequestsEnabled, authUserId])

  useEffect(() => {
    if (!sharedJournalEnabled) {
      return undefined
    }

    let isMounted = true

    listJournalEntries().then(({ items, error }) => {
      if (!isMounted) {
        return
      }

      if (error) {
        setJournalSyncStatus(getJournalSyncMessage(error))
        setJournalSyncTone(isTransientSupabaseError(error) ? 'neutral' : 'error')
        return
      }

      setJournalItems(items)
      setJournalSyncStatus('Your journal is syncing across signed-in devices.')
      setJournalSyncTone('neutral')
    })

    const unsubscribe = subscribeToJournalEntries(
      (items) => {
        if (!isMounted) {
          return
        }

        setJournalItems(items)
        setJournalSyncStatus('Your journal is syncing across signed-in devices.')
        setJournalSyncTone('neutral')
      },
      (error) => {
        if (!isMounted) {
          return
        }

        setJournalSyncStatus(getJournalSyncMessage(error))
        setJournalSyncTone(isTransientSupabaseError(error) ? 'neutral' : 'error')
      },
    )

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [sharedJournalEnabled, authUserId])

  const activeRole = authSession?.role ?? selectedRole
  const visibleFocusItems = focusItems.filter((item) => {
    if (item.visibilityScope !== 'pastoral') {
      return true
    }

    return (
      activeRole === 'pastor' ||
      activeRole === 'prayer-core' ||
      item.ownerUserId === authSession?.userId
    )
  })

  const deferredQueueIndex = new Map(
    deferredQueueIds.map((itemId, index) => [itemId, index]),
  )

  function sortDeferredQueueItems(items) {
    return [...items].sort((leftItem, rightItem) => {
      const leftIndex = deferredQueueIndex.has(leftItem.id) ? deferredQueueIndex.get(leftItem.id) : -1
      const rightIndex = deferredQueueIndex.has(rightItem.id) ? deferredQueueIndex.get(rightItem.id) : -1

      if (leftIndex === -1 && rightIndex === -1) {
        return 0
      }

      if (leftIndex === -1) {
        return -1
      }

      if (rightIndex === -1) {
        return 1
      }

      return leftIndex - rightIndex
    })
  }

  const effectiveRequestSyncStatus =
    requestSyncStatus ||
    (!authReady && isSupabaseConfigured
      ? 'Restoring your Supabase session...'
      : sharedPrayerRequestsEnabled
        ? 'Connecting shared requests for signed-in members...'
        : isSupabaseConfigured
          ? 'Supabase is configured. Sign in to sync requests across devices.'
          : 'Requests are currently using local device storage.')
  const effectiveRequestSyncTone = sharedPrayerRequestsEnabled ? requestSyncTone : 'neutral'
  const effectiveJournalSyncStatus =
    journalSyncStatus ||
    (!authReady && isSupabaseConfigured
      ? 'Restoring your Supabase session...'
      : sharedJournalEnabled
        ? 'Connecting your journal across signed-in devices...'
        : isSupabaseConfigured
          ? 'Supabase is configured. Sign in to sync your journal across devices.'
          : 'Journal entries are currently using local device storage.')
  const effectiveJournalSyncTone = sharedJournalEnabled ? journalSyncTone : 'neutral'
  const { devotion: dailyDevotion, teaching: dailyTeaching } = homeContent

  const sharedPrayerQueue = sortDeferredQueueItems(
    visibleFocusItems
      .filter((item) => !item.answeredAt && item.workflowStatus === 'queue')
      .map((item) => ({
        id: item.id,
        focusItemId: item.id,
        name: item.isAnonymous ? 'Anonymous member' : item.requestedBy,
        requestedBy: item.requestedBy,
        isAnonymous: item.isAnonymous,
        request: item.label,
        category: item.category,
        confidentiality: item.confidentiality,
        submittedBy: item.submittedBy,
        assignedTo: item.assignedTo,
        flaggedAt: item.flaggedAt,
        prayedAt: item.prayedAt,
        ownerUserId: item.ownerUserId,
        visibilityScope: item.visibilityScope,
        followUpStatus: item.followUpStatus,
        prayedNotice: item.prayedNotice,
        prayedNotifiedAt: item.prayedNotifiedAt,
        prayedBy: item.prayedBy,
      })),
  )
  const sharedPastoralReviewItems = visibleFocusItems
    .filter((item) => !item.answeredAt && item.workflowStatus === 'review')
    .map((item) => ({
      id: item.id,
      focusItemId: item.id,
      name: item.isAnonymous ? 'Anonymous member' : item.requestedBy,
      requestedBy: item.requestedBy,
      isAnonymous: item.isAnonymous,
      request: item.label,
      category: item.category,
      confidentiality: item.confidentiality,
      submittedBy: item.submittedBy,
      assignedTo: item.assignedTo,
      flaggedAt: item.flaggedAt,
      prayedAt: item.prayedAt,
      ownerUserId: item.ownerUserId,
      visibilityScope: item.visibilityScope,
      followUpStatus: item.followUpStatus,
      prayedNotice: item.prayedNotice,
      prayedNotifiedAt: item.prayedNotifiedAt,
      prayedBy: item.prayedBy,
    }))
  const sharedPrayedDeckItems = visibleFocusItems
    .filter((item) => item.workflowStatus === 'prayed')
    .map((item) => ({
      id: item.id,
      focusItemId: item.id,
      name: item.isAnonymous ? 'Anonymous member' : item.requestedBy,
      requestedBy: item.requestedBy,
      isAnonymous: item.isAnonymous,
      request: item.label,
      category: item.category,
      confidentiality: item.confidentiality,
      submittedBy: item.submittedBy,
      assignedTo: item.assignedTo,
      flaggedAt: item.flaggedAt,
      prayedAt: item.prayedAt,
      ownerUserId: item.ownerUserId,
      visibilityScope: item.visibilityScope,
      followUpStatus: item.followUpStatus,
      prayedNotice: item.prayedNotice,
      prayedNotifiedAt: item.prayedNotifiedAt,
      prayedBy: item.prayedBy,
    }))

  const effectivePrayerQueue = sharedPrayerRequestsEnabled ? sharedPrayerQueue : prayerQueue
  const effectivePastoralReviewItems = sharedPrayerRequestsEnabled
    ? sharedPastoralReviewItems
    : pastoralReviewItems
  const effectivePrayedDeckItems = sharedPrayerRequestsEnabled ? sharedPrayedDeckItems : prayedDeckItems

  const activeFocusItems = visibleFocusItems.filter((item) => !item.answeredAt)
  const answeredFocusItems = visibleFocusItems.filter((item) => item.answeredAt)
  const completedFocusItems = activeFocusItems.filter((item) => item.completed).length
  const testimonySharedCount = visibleFocusItems.filter((item) => item.testimonyShared).length
  const followUpRequestedCount = visibleFocusItems.filter((item) => item.followUpStatus === 'requested').length
  const sensitivePendingCount = visibleFocusItems.filter(
    (item) => !item.answeredAt && item.visibilityScope === 'pastoral',
  ).length
  const prayedCoverageCount = visibleFocusItems.filter((item) => item.workflowStatus === 'prayed').length
  const answerRate = activeFocusItems.length + answeredFocusItems.length
    ? Math.round((answeredFocusItems.length / (activeFocusItems.length + answeredFocusItems.length)) * 100)
    : 0
  const currentDeckCard = effectivePrayerQueue[0]
  const nextDeckCard = effectivePrayerQueue[1]
  const filteredFocusItems = activeFocusItems.filter((item) => {
    if (focusFilter === 'active') {
      return !item.completed
    }

    if (focusFilter === 'completed') {
      return item.completed
    }

    return true
  })
  const swipeIntent = swipeOffset > 40 ? 'prayed' : swipeOffset < -40 ? 'pending' : null
  const swipeCardTransform = currentDeckCard
    ? `translateX(${swipeOffset}px) rotate(${swipeOffset / 18}deg)`
    : undefined
  const activeRoleConfig = roleOptions.find((role) => role.id === activeRole) ?? roleOptions[0]
  const memberDisplayName =
    memberProfile.displayName.trim() ||
    memberProfile.fullName.trim() ||
    authSession?.email?.split('@')[0] ||
    'Community member'
  const memberNameForGreeting = memberProfile.displayName || memberProfile.fullName || memberDisplayName
  const accountTypeLabel =
    activeRole === 'prayer-core'
      ? 'Prayer Core'
      : activeRole === 'pastor'
        ? 'Pastor'
        : activeRole === 'intercessor'
          ? 'Intercessor'
          : 'Member'
  const canManageTeaching =
    activeRole === 'prayer-core' || activeRole === 'pastor'
  const canManageMembers =
    authSession?.provider === 'supabase' && (activeRole === 'prayer-core' || activeRole === 'pastor')
  const canRemoveRequests =
    !sharedPrayerRequestsEnabled || activeRole === 'pastor' || activeRole === 'prayer-core'
  const canManagePrayerWorkflow = activeRole === 'intercessor' || activeRole === 'pastor' || activeRole === 'prayer-core'
  const showSwipeQueue = activeRole === 'intercessor' || activeRole === 'prayer-core'
  const showPastoralReview = activeRole === 'pastor' || activeRole === 'prayer-core'
  const showTeamSpaces = activeRole === 'intercessor' || activeRole === 'prayer-core'
  const showPrayerRhythm = activeRole !== 'pastor'

  function getAccountTypeFromRole(role) {
    if (role === 'pastor') {
      return 'pastor'
    }

    if (role === 'prayer-core') {
      return 'owner'
    }

    return 'member'
  }

  async function handleRefreshMemberDirectory(showSuccessMessage = false) {
    if (!canManageMembers) {
      setMemberDirectoryItems([])
      return
    }

    setMemberDirectoryBusy(true)

    const { items, error } = await listMemberAccounts()

    if (error) {
      setMemberDirectoryStatus(getMemberDirectorySyncMessage(error))
      setMemberDirectoryTone(isTransientSupabaseError(error) ? 'neutral' : 'error')
      setMemberDirectoryBusy(false)
      return
    }

    setMemberDirectoryItems(items)

    if (showSuccessMessage) {
      setMemberDirectoryStatus('Registered members refreshed.')
      setMemberDirectoryTone('neutral')
    }

    setMemberDirectoryBusy(false)
  }

  async function handleUpdateMemberRole(userId, nextRole) {
    setMemberDirectoryBusy(true)

    const { item, error } = await updateMemberAccountRole(userId, nextRole)

    if (error) {
      setMemberDirectoryStatus(
        isTransientSupabaseError(error)
          ? 'Supabase is unreachable right now, so member roles cannot be changed until the connection returns.'
          : `Unable to update this member role: ${error}`,
      )
      setMemberDirectoryTone(isTransientSupabaseError(error) ? 'neutral' : 'error')
      setMemberDirectoryBusy(false)
      return
    }

    setMemberDirectoryItems((currentItems) =>
      currentItems.map((member) => (member.userId === userId ? item : member)),
    )

    const updatedRoleLabel = roleOptions.find((role) => role.id === item.role)?.label ?? item.role
    setMemberDirectoryStatus(`${item.email || 'Member'} is now ${updatedRoleLabel}.`)
    setMemberDirectoryTone('neutral')

    if (userId === authSession?.userId) {
      const nextSession = {
        ...authSession,
        role: item.role,
        memberProfile: {
          ...authSession.memberProfile,
          fullName: item.fullName,
          displayName: item.displayName,
          phone: item.phone,
          address: item.address,
          churchName: item.churchName,
          pastorName: item.pastorName,
          bio: item.bio,
          avatarUrl: item.avatarUrl,
          accountType: getAccountTypeFromRole(item.role),
        },
      }

      applyAuthSession(nextSession)
    }

    setMemberDirectoryBusy(false)
  }

  useEffect(() => {
    if (!canManageMembers) {
      return undefined
    }

    let isMounted = true

    Promise.resolve().then(async () => {
      if (!isMounted) {
        return
      }

      setMemberDirectoryBusy(true)

      const { items, error } = await listMemberAccounts()

      if (!isMounted) {
        return
      }

      if (error) {
        setMemberDirectoryStatus(getMemberDirectorySyncMessage(error))
        setMemberDirectoryTone(isTransientSupabaseError(error) ? 'neutral' : 'error')
        setMemberDirectoryBusy(false)
        return
      }

      setMemberDirectoryItems(items)
      setMemberDirectoryBusy(false)
    })

    return () => {
      isMounted = false
    }
  }, [canManageMembers])

  function removeLinkedDeckEntries(focusItemId) {
    if (sharedPrayerRequestsEnabled) {
      return
    }

    setPrayerQueue((currentItems) => currentItems.filter((item) => item.focusItemId !== focusItemId))
    setPastoralReviewItems((currentItems) =>
      currentItems.filter((item) => item.focusItemId !== focusItemId),
    )
    setPrayedDeckItems((currentItems) =>
      currentItems.filter((item) => item.focusItemId !== focusItemId),
    )
  }

  function resetSwipeGesture() {
    swipeStartXRef.current = null
    swipePointerIdRef.current = null
    setSwipeOffset(0)
  }

  async function handleAddPrayerRequest(event) {
    event.preventDefault()

    const trimmedRequest = requestText.trim()

    if (!trimmedRequest) {
      return
    }

    const focusId = createId('focus')
    const requesterName = requestIsAnonymous ? 'Anonymous member' : memberDisplayName
    const isPastoralOnly = requestVisibilityScope === 'pastoral'

    const nextFocusItem = {
      id: focusId,
      label: trimmedRequest,
      completed: false,
      answeredAt: null,
      answeredNote: '',
      requestedBy: requesterName,
      isAnonymous: requestIsAnonymous,
      workflowStatus: isPastoralOnly ? 'review' : 'queue',
      category: isPastoralOnly ? 'Sensitive care' : 'Community care',
      confidentiality: isPastoralOnly ? 'Pastoral sensitive' : 'Intercessor safe',
      submittedBy: requestIsAnonymous ? 'Anonymous prayer request' : 'Member prayer request',
      assignedTo: isPastoralOnly ? 'Pastor and prayer core' : 'Intercessory team',
      flaggedAt: isPastoralOnly ? formatAnsweredDate() : null,
      prayedAt: null,
      ownerUserId: authSession?.userId ?? null,
      visibilityScope: requestVisibilityScope,
      followUpStatus: 'none',
      followUpMessages: [],
      prayedNotice: '',
      prayedNotifiedAt: null,
      prayedBy: '',
      testimonyText: '',
      testimonyShared: false,
    }

    if (sharedPrayerRequestsEnabled) {
      const { item, error } = await createPrayerRequest(nextFocusItem)

      if (error) {
        if (isTransientSupabaseError(error)) {
          setRequestSyncStatus('Supabase is reconnecting, so this prayer request was not saved to Supabase yet.')
          setRequestSyncTone('neutral')
          return
        }

        setRequestSyncStatus(`Unable to save this request to Supabase: ${error}`)
        setRequestSyncTone('error')
        return
      }

      setFocusItems((currentItems) => [item, ...currentItems.filter((entry) => entry.id !== item.id)])
      setRequestSyncStatus('Shared requests are syncing across signed-in devices.')
      setRequestSyncTone('neutral')
    } else {
      setFocusItems((currentItems) => [nextFocusItem, ...currentItems])
    }

    if (!sharedPrayerRequestsEnabled) {
      if (!isPastoralOnly) {
        addPrayerRequestToLocalDeck(nextFocusItem, requesterName)
      }
    }
    setRequestText('')
    setRequestIsAnonymous(false)
    setRequestVisibilityScope('team')
    requestInputRef.current?.focus()
  }

  function handleMemberProfileChange(event) {
    const { name, value } = event.target

    if (memberProfileStatus) {
      setMemberProfileStatus('')
    }

    setMemberProfileForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  function handleSignUpChange(event) {
    const { name, value } = event.target

    resetAuthMessages()
    setSignUpForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  function handleTeachingChange(event) {
    const { name, value } = event.target

    if (teachingStatus) {
      setTeachingStatus('')
    }

    setTeachingForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  function readImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => reject(new Error('Unable to read the selected image.'))
      reader.readAsDataURL(file)
    })
  }

  async function handleMemberAvatarChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const avatarUrl = await readImageAsDataUrl(file)
      setMemberProfileForm((currentForm) => ({
        ...currentForm,
        avatarUrl,
      }))
      if (memberProfileStatus) {
        setMemberProfileStatus('')
      }
    } catch (error) {
      setMemberProfileStatus(error.message)
    }
  }

  async function handleSaveMemberProfile(event) {
    event.preventDefault()

    const nextProfile = {
      ...memberProfileForm,
      fullName: memberProfileForm.fullName.trim(),
      displayName: memberProfileForm.displayName.trim(),
      phone: memberProfileForm.phone.trim(),
      address: memberProfileForm.address.trim(),
      churchName: memberProfileForm.churchName.trim(),
      pastorName: memberProfileForm.pastorName.trim(),
      bio: memberProfileForm.bio.trim(),
    }

    if (!nextProfile.fullName && !nextProfile.displayName) {
      setMemberProfileStatus('Add at least a full name or a display name before saving.')
      return
    }

    setAuthBusy(true)

    const { session, error } = await savePrayerAppMemberProfile(nextProfile, authSession)

    if (error) {
      if (isTransientSupabaseError(error)) {
        setMemberProfileStatus('Supabase is reconnecting, so your profile was not saved to Supabase yet.')
        setAuthBusy(false)
        return
      }

      setMemberProfileStatus(error)
      setAuthBusy(false)
      return
    }

    setMemberProfile(nextProfile)
    setMemberProfileForm(nextProfile)
    setMemberProfileStatus(
      authSession?.provider === 'supabase'
        ? 'Member profile saved to your Supabase account.'
        : 'Member profile saved on this device.',
    )

    if (session) {
      applyAuthSession(session)
    }

    setAuthBusy(false)
  }

  async function handleSaveTeaching(event) {
    event.preventDefault()

    if (!canManageTeaching) {
      return
    }

    const nextTeaching = {
      publishDate: teachingForm.publishDate,
      title: teachingForm.title.trim(),
      speaker: teachingForm.speaker.trim(),
      theme: teachingForm.theme.trim(),
      summary: teachingForm.summary.trim(),
      source: 'Supabase teaching feed',
      link: teachingForm.link.trim(),
    }

    if (
      !nextTeaching.publishDate ||
      !nextTeaching.title ||
      !nextTeaching.speaker ||
      !nextTeaching.theme ||
      !nextTeaching.summary
    ) {
      setTeachingStatus('Publish date, title, teacher, theme, and summary are required.')
      setTeachingTone('error')
      return
    }

    if (!sharedTeachingEnabled) {
      setTeachingStatus(
        'Configure Supabase and run the daily_teachings SQL script to manage teachings from the app.',
      )
      setTeachingTone('error')
      return
    }

    setAuthBusy(true)

    const { item, error } = await saveFeaturedTeaching(nextTeaching)

    if (error) {
      if (isTransientSupabaseError(error)) {
        setTeachingStatus('Supabase is reconnecting, so this teaching was not saved to Supabase yet.')
        setTeachingTone('neutral')
        setAuthBusy(false)
        return
      }

      setTeachingStatus(error)
      setTeachingTone('error')
      setAuthBusy(false)
      return
    }

    setHomeContent((currentContent) => ({
      ...currentContent,
      teaching: item,
    }))
    setTeachingForm({
      publishDate: item.publishDate,
      title: item.title,
      speaker: item.speaker,
      theme: item.theme,
      summary: item.summary,
      source: item.source ?? 'Supabase teaching feed',
      link: item.link ?? '',
    })
    setTeachingStatus('Daily teaching saved to Supabase.')
    setTeachingTone('neutral')
    setAuthBusy(false)
  }

  async function handleToggleFocusItem(itemId) {
    const selectedItem = focusItems.find((item) => item.id === itemId)

    if (!selectedItem) {
      return
    }

    const nextItem = { ...selectedItem, completed: !selectedItem.completed }

    if (sharedPrayerRequestsEnabled) {
      const { item, error } = await updatePrayerRequest(itemId, nextItem)

      if (error) {
        if (isTransientSupabaseError(error)) {
          setRequestSyncStatus('Supabase is reconnecting, so this prayer update was not saved to Supabase yet.')
          setRequestSyncTone('neutral')
          return
        }

        setRequestSyncStatus(`Unable to update this request in Supabase: ${error}`)
        setRequestSyncTone('error')
        return
      }

      setFocusItems((currentItems) =>
        currentItems.map((entry) => (entry.id === itemId ? item : entry)),
      )
      return
    }

    setFocusItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      ),
    )
  }

  async function handleRemoveFocusItem(itemId) {
    if (sharedPrayerRequestsEnabled) {
      const { error } = await deletePrayerRequest(itemId)

      if (error) {
        if (isTransientSupabaseError(error)) {
          setRequestSyncStatus('Supabase is reconnecting, so this request was not removed from Supabase yet.')
          setRequestSyncTone('neutral')
          return
        }

        setRequestSyncStatus(`Unable to remove this request from Supabase: ${error}`)
        setRequestSyncTone('error')
        return
      }
    }

    setFocusItems((currentItems) => currentItems.filter((item) => item.id !== itemId))
    removeLinkedDeckEntries(itemId)
  }

  async function handleMarkAnswered(itemId) {
    const selectedItem = focusItems.find((item) => item.id === itemId)

    if (!selectedItem) {
      return
    }

    const nextItem = {
      ...selectedItem,
      completed: true,
      answeredAt: formatAnsweredDate(),
      workflowStatus: sharedPrayerRequestsEnabled ? 'answered' : selectedItem.workflowStatus,
      flaggedAt: null,
      prayedAt: null,
    }

    if (sharedPrayerRequestsEnabled) {
      const { item, error } = await updatePrayerRequest(itemId, nextItem)

      if (error) {
        if (isTransientSupabaseError(error)) {
          setRequestSyncStatus('Supabase is reconnecting, so this answered update was not saved to Supabase yet.')
          setRequestSyncTone('neutral')
          return
        }

        setRequestSyncStatus(`Unable to mark this request answered in Supabase: ${error}`)
        setRequestSyncTone('error')
        return
      }

      removeLinkedDeckEntries(itemId)
      setFocusItems((currentItems) =>
        currentItems.map((entry) => (entry.id === itemId ? item : entry)),
      )
      return
    }

    removeLinkedDeckEntries(itemId)
    setFocusItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? { ...item, completed: true, answeredAt: formatAnsweredDate() }
          : item,
      ),
    )
  }

  async function handleRestoreAnswered(itemId) {
    const selectedItem = focusItems.find((item) => item.id === itemId)

    if (!selectedItem) {
      return
    }

    const nextItem = {
      ...selectedItem,
      completed: false,
      answeredAt: null,
      answeredNote: '',
    }

    if (sharedPrayerRequestsEnabled) {
      const { item, error } = await updatePrayerRequest(itemId, nextItem)

      if (error) {
        if (isTransientSupabaseError(error)) {
          setRequestSyncStatus('Supabase is reconnecting, so this prayer was not reopened in Supabase yet.')
          setRequestSyncTone('neutral')
          return
        }

        setRequestSyncStatus(`Unable to reopen this request in Supabase: ${error}`)
        setRequestSyncTone('error')
        return
      }

      setFocusItems((currentItems) =>
        currentItems.map((entry) => (entry.id === itemId ? item : entry)),
      )
      return
    }

    setFocusItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? { ...item, completed: false, answeredAt: null, answeredNote: '' }
          : item,
      ),
    )
  }

  function handleAnsweredNoteChange(itemId, value) {
    let previousItem = null
    let nextItem = null

    setFocusItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        previousItem = item
        nextItem = { ...item, answeredNote: value }
        return nextItem
      }),
    )

    if (!sharedPrayerRequestsEnabled || !nextItem) {
      return
    }

    updatePrayerRequest(itemId, nextItem).then(({ item, error }) => {
      if (!error && item) {
        setFocusItems((currentItems) =>
          currentItems.map((entry) => (entry.id === itemId ? item : entry)),
        )
        return
      }

      if (previousItem) {
        setFocusItems((currentItems) =>
          currentItems.map((entry) => (entry.id === itemId ? previousItem : entry)),
        )
      }

      if (isTransientSupabaseError(error)) {
        setRequestSyncStatus('Supabase is reconnecting, so the answered note was not saved to Supabase yet.')
        setRequestSyncTone('neutral')
        return
      }

      setRequestSyncStatus(`Unable to sync the answered note to Supabase: ${error}`)
      setRequestSyncTone('error')
    })
  }

  async function handleToggleFollowUp(itemId) {
    const selectedItem = focusItems.find((item) => item.id === itemId)

    if (!selectedItem) {
      return
    }

    const nextItem = {
      ...selectedItem,
      followUpStatus: selectedItem.followUpStatus === 'requested' ? 'none' : 'requested',
      followUpMessages:
        selectedItem.followUpStatus === 'requested' || (selectedItem.followUpMessages?.length ?? 0) > 0
          ? selectedItem.followUpMessages ?? []
          : [
              {
                id: createId('follow-up'),
                text: `${memberDisplayName} requested a follow-up update on this prayer request.`,
                authorName: memberDisplayName,
                authorRole: activeRoleConfig.label,
                senderType: 'team',
                createdAt: formatAnsweredDate(),
              },
            ],
    }

    if (sharedPrayerRequestsEnabled) {
      const { item, error } = await updatePrayerRequest(itemId, nextItem)

      if (error) {
        if (isTransientSupabaseError(error)) {
          setRequestSyncStatus('Supabase is reconnecting, so the follow-up flag was not saved to Supabase yet.')
          setRequestSyncTone('neutral')
          return
        }

        setRequestSyncStatus(`Unable to update follow-up for this request: ${error}`)
        setRequestSyncTone('error')
        return
      }

      setFocusItems((currentItems) =>
        currentItems.map((entry) => (entry.id === itemId ? item : entry)),
      )
      setRequestSyncStatus('Shared requests are syncing across signed-in devices.')
      setRequestSyncTone('neutral')
      return
    }

    setFocusItems((currentItems) =>
      currentItems.map((entry) => (entry.id === itemId ? nextItem : entry)),
    )
  }

  function handleJournalChange(event) {
    const { name, value } = event.target

    setJournalForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  async function handleAddJournalEntry(event) {
    event.preventDefault()

    const trimmedTitle = journalForm.title.trim()
    const trimmedDetail = journalForm.detail.trim()

    if (!trimmedTitle || !trimmedDetail) {
      return
    }

    const nextEntry = {
      id: createId('journal'),
      title: trimmedTitle,
      detail: trimmedDetail,
      date: formatEntryDate(),
    }

    if (sharedJournalEnabled) {
      const { item, error } = await createJournalEntry(nextEntry)

      if (error) {
        if (isTransientSupabaseError(error)) {
          setJournalSyncStatus('Supabase is reconnecting, so this journal entry was not saved to Supabase yet.')
          setJournalSyncTone('neutral')
          return
        }

        setJournalSyncStatus(`Unable to save this journal entry to Supabase: ${error}`)
        setJournalSyncTone('error')
        return
      }

      setJournalItems((currentEntries) => [item, ...currentEntries.filter((entry) => entry.id !== item.id)])
      setJournalSyncStatus('Your journal is syncing across signed-in devices.')
      setJournalSyncTone('neutral')
    } else {
      setJournalItems((currentEntries) => [nextEntry, ...currentEntries])
    }

    setJournalForm({ title: '', detail: '' })
    journalTitleRef.current?.focus()
  }

  async function handleRemoveJournalEntry(entryId) {
    if (sharedJournalEnabled) {
      const { error } = await deleteJournalEntry(entryId)

      if (error) {
        if (isTransientSupabaseError(error)) {
          setJournalSyncStatus('Supabase is reconnecting, so this journal entry was not removed from Supabase yet.')
          setJournalSyncTone('neutral')
          return
        }

        setJournalSyncStatus(`Unable to remove this journal entry from Supabase: ${error}`)
        setJournalSyncTone('error')
        return
      }

      setJournalSyncStatus('Your journal is syncing across signed-in devices.')
      setJournalSyncTone('neutral')
    }

    setJournalItems((currentEntries) => currentEntries.filter((entry) => entry.id !== entryId))
  }

  async function updateSharedWorkflowItem(itemId, updates, failurePrefix) {
    const { item, error } = await updatePrayerRequest(itemId, updates)

    if (error) {
      if (isTransientSupabaseError(error)) {
        setRequestSyncStatus('Supabase is reconnecting, so this workflow change was not saved to Supabase yet.')
        setRequestSyncTone('neutral')
        return null
      }

      setRequestSyncStatus(`${failurePrefix}: ${error}`)
      setRequestSyncTone('error')
      return null
    }

    setFocusItems((currentItems) =>
      currentItems.map((entry) => (entry.id === itemId ? item : entry)),
    )
    setRequestSyncStatus('Shared requests are syncing across signed-in devices.')
    setRequestSyncTone('neutral')
    return item
  }

  async function handleDeckDecision(decision) {
    if (!currentDeckCard) {
      return
    }

    if (decision === 'pending') {
      if (sharedPrayerRequestsEnabled) {
        deferQueueId(currentDeckCard.focusItemId)
      } else {
        setPrayerQueue((currentItems) =>
          currentItems.length > 1 ? [...currentItems.slice(1), currentItems[0]] : currentItems,
        )
      }

      setLastDeckAction('Request kept pending for another prayer pass.')
      resetSwipeGesture()
      return
    }

    if (sharedPrayerRequestsEnabled) {
      const selectedItem = focusItems.find((item) => item.id === currentDeckCard.focusItemId)

      if (!selectedItem) {
        return
      }

      const nextItem = buildPrayedUpdate(selectedItem)

      const updatedItem = await updateSharedWorkflowItem(
        selectedItem.id,
        nextItem,
        'Unable to mark this request as prayed',
      )
      if (!updatedItem) {
        resetSwipeGesture()
        return
      }
      clearDeferredQueueId(selectedItem.id)
      setLastDeckAction(
        'Request marked as prayed and the requester can now see that prayer coverage happened.',
      )
      resetSwipeGesture()
      return
    }

    setPrayerQueue((currentItems) => currentItems.slice(1))

    setPrayedDeckItems((currentItems) => [
      { ...currentDeckCard, ...buildPrayedUpdate(currentDeckCard) },
      ...currentItems,
    ])
    setLastDeckAction('Request marked as prayed and the requester can now see that prayer coverage happened.')
    resetSwipeGesture()
  }

  async function handleSendCurrentDeckToReview() {
    if (!currentDeckCard) {
      return
    }

    if (sharedPrayerRequestsEnabled) {
      const selectedItem = focusItems.find((item) => item.id === currentDeckCard.focusItemId)

      if (!selectedItem) {
        return
      }

      const updatedItem = await updateSharedWorkflowItem(
        selectedItem.id,
        {
          ...selectedItem,
          workflowStatus: 'review',
          visibilityScope: 'pastoral',
          confidentiality: 'Pastoral sensitive',
          assignedTo: 'Pastor and prayer core',
          flaggedAt: formatAnsweredDate(),
          prayedAt: null,
        },
        'Unable to send this request to pastoral review',
      )
      if (!updatedItem) {
        resetSwipeGesture()
        return
      }
      clearDeferredQueueId(selectedItem.id)
      setLastDeckAction('Request moved into pastoral review and is now limited to pastor and prayer core.')
      resetSwipeGesture()
      return
    }

    setPrayerQueue((currentItems) => currentItems.slice(1))
    setPastoralReviewItems((currentItems) => [
      {
        ...currentDeckCard,
        visibilityScope: 'pastoral',
        confidentiality: 'Pastoral sensitive',
        assignedTo: 'Pastor and prayer core',
        flaggedAt: formatAnsweredDate(),
      },
      ...currentItems,
    ])
    setLastDeckAction('Request moved into pastoral review and is now limited to pastor and prayer core.')
    resetSwipeGesture()
  }

  function handleDeckPointerDown(event) {
    if (!currentDeckCard) {
      return
    }

    swipeStartXRef.current = event.clientX
    swipePointerIdRef.current = event.pointerId
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handleDeckPointerMove(event) {
    if (event.pointerId !== swipePointerIdRef.current || swipeStartXRef.current === null) {
      return
    }

    setSwipeOffset(event.clientX - swipeStartXRef.current)
  }

  function handleDeckPointerUp(event) {
    if (event.pointerId !== swipePointerIdRef.current || swipeStartXRef.current === null) {
      return
    }

    const dragDistance = event.clientX - swipeStartXRef.current

    event.currentTarget.releasePointerCapture?.(event.pointerId)

    if (dragDistance > 120) {
      handleDeckDecision('prayed')
      return
    }

    if (dragDistance < -120) {
      handleDeckDecision('pending')
      return
    }

    resetSwipeGesture()
  }

  function handleDeckPointerCancel(event) {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    resetSwipeGesture()
  }

  async function handleApproveReview(itemId) {
    const selectedItem = effectivePastoralReviewItems.find((item) => item.id === itemId)

    if (!selectedItem) {
      return
    }

    if (sharedPrayerRequestsEnabled) {
      const selectedFocusItem = focusItems.find((item) => item.id === itemId)

      if (!selectedFocusItem) {
        return
      }

      const updatedItem = await updateSharedWorkflowItem(itemId, {
        ...buildPrayedUpdate(selectedFocusItem),
      }, 'Unable to approve this prayer request')
      if (!updatedItem) {
        return
      }
      clearDeferredQueueId(itemId)
      setLastDeckAction('Pastoral review approved and moved to prayed.')
      return
    }

    setPastoralReviewItems((currentItems) => currentItems.filter((item) => item.id !== itemId))
    setPrayedDeckItems((currentItems) => [
      { ...selectedItem, prayedAt: formatAnsweredDate() },
      ...currentItems,
    ])
    setLastDeckAction('Pastoral review approved and moved to prayed.')
  }

  async function handleReturnToQueue(itemId) {
    const selectedItem = effectivePastoralReviewItems.find((item) => item.id === itemId)

    if (!selectedItem) {
      return
    }

    if (sharedPrayerRequestsEnabled) {
      const selectedFocusItem = focusItems.find((item) => item.id === itemId)

      if (!selectedFocusItem) {
        return
      }

      const updatedItem = await updateSharedWorkflowItem(itemId, {
        ...selectedFocusItem,
        workflowStatus: 'queue',
        visibilityScope: 'team',
        confidentiality: 'Intercessor safe',
        assignedTo: 'Intercessory team',
        flaggedAt: null,
        prayedAt: null,
      }, 'Unable to return this request to the queue')
      if (!updatedItem) {
        return
      }
      clearDeferredQueueId(itemId)
      setLastDeckAction('Pastoral review request returned to the live queue.')
      return
    }

    setPastoralReviewItems((currentItems) => currentItems.filter((item) => item.id !== itemId))
    setPrayerQueue((currentItems) => [
      {
        ...selectedItem,
        flaggedAt: null,
        prayedAt: null,
      },
      ...currentItems,
    ])
    setLastDeckAction('Pastoral review request returned to the live queue.')
  }

  async function handleSignIn(event) {
    event.preventDefault()

    setAuthBusy(true)
    resetAuthMessages()

    const { session, error } = await signInToPrayerApp({
      email,
      password,
    })

    if (error) {
      setAuthError(error)
      setAuthBusy(false)
      return
    }

    applyAuthSession(session)
    setAuthError('')
    setAuthNotice('')
    setEmail('')
    setPassword('')
    setAuthBusy(false)
  }

  async function handleSignUp(event) {
    event.preventDefault()

    setAuthBusy(true)
    resetAuthMessages()

    const nextProfile = {
      ...signUpForm,
      fullName: signUpForm.fullName.trim(),
      displayName: signUpForm.displayName.trim(),
      phone: signUpForm.phone.trim(),
      address: signUpForm.address.trim(),
      churchName: signUpForm.churchName.trim(),
      pastorName: signUpForm.pastorName.trim(),
      bio: signUpForm.bio.trim(),
      accountType: 'member',
    }

    if (!nextProfile.fullName || !email.trim() || !password) {
      setAuthError('Full name, email, and password are required to create an account.')
      setAuthBusy(false)
      return
    }

    const { session, message, error } = await signUpToPrayerApp({
      email,
      password,
      memberProfile: nextProfile,
    })

    if (error) {
      setAuthError(error)
      setAuthBusy(false)
      return
    }

    if (session) {
      applyAuthSession(session)
    }

    setMemberProfile(nextProfile)
    setMemberProfileForm(nextProfile)
    setSignUpForm(defaultMemberProfile)
    setAuthNotice(message || 'Account created successfully.')
    setAuthMode(session ? 'sign-in' : 'sign-in')
    setPassword('')
    setEmail(session ? '' : email)
    setAuthBusy(false)
  }

  async function handleSignOut() {
    setAuthBusy(true)

    const { error } = await signOutOfPrayerApp()

    applyAuthSession(null)
    setSelectedRole('member')
    setMemberProfile(defaultMemberProfile)
    setMemberProfileForm(defaultMemberProfile)
    setMemberProfileStatus('')
    setRequestSyncStatus('')
    setRequestSyncTone('neutral')
    setJournalSyncStatus('')
    setJournalSyncTone('neutral')
    setMemberDirectoryStatus('')
    setMemberDirectoryTone('neutral')
    setLastDeckAction('')
    setDeferredQueueIds([])
    setRequestVisibilityScope('team')
    const fallbackTeaching = getFallbackTeaching()
    setHomeContent((currentContent) => ({
      ...currentContent,
      teaching: fallbackTeaching,
    }))
    setTeachingForm({
      publishDate: fallbackTeaching.publishDate,
      title: fallbackTeaching.title,
      speaker: fallbackTeaching.speaker,
      theme: fallbackTeaching.theme,
      summary: fallbackTeaching.summary,
      source: 'Supabase teaching feed',
      link: '',
    })
    setEmail('')
    setPassword('')
    setAuthError('')
    setAuthNotice(
      error
        ? `Signed out on this device, but Supabase returned an error: ${error}`
        : '',
    )
    setCurrentView('home')
    setAuthBusy(false)
  }

  if (!authReady) {
    return <AppLoadingScreen />
  }

  if (!authSession) {
    return (
      <AuthPanel
        authMode={authMode}
        email={email}
        password={password}
        signUpForm={signUpForm}
        authError={authError}
        authNotice={authNotice}
        authBusy={authBusy}
        providerConfigured={isSupabaseConfigured}
        onModeChange={(mode) => {
          setAuthMode(mode)
          resetAuthMessages()
        }}
        onEmailChange={(value) => {
          setEmail(value)
          resetAuthMessages()
        }}
        onPasswordChange={(value) => {
          setPassword(value)
          resetAuthMessages()
        }}
        onSignUpChange={handleSignUpChange}
        onSignInSubmit={handleSignIn}
        onSignUpSubmit={handleSignUp}
      />
    )
  }

  return (
    <main className="app-shell">
      <AppNavbar currentView={currentView} onChangeView={setCurrentView} />

      <section className="panel role-shell">
        <div className="role-shell-copy">
          <p className="eyebrow">Workspace role</p>
          <h2>{activeRoleConfig.label} view</h2>
          <p className="role-summary">{activeRoleConfig.summary}</p>
        </div>

        <div className="role-switcher">
          <p className="session-meta">
            {authSession.email ? `${authSession.email} via ${authSession.provider}` : `Signed in ${authSession.signedInAt}`}
          </p>
          <button type="button" className="ghost-action" onClick={handleSignOut} disabled={authBusy}>
            Sign out
          </button>
        </div>
      </section>

      {currentView === 'home' ? (
        <HomeView
          memberName={memberNameForGreeting}
          accountType={accountTypeLabel}
          answeredCount={answeredFocusItems.length}
          completedCount={completedFocusItems}
          activeCount={activeFocusItems.length}
          requestInputRef={requestInputRef}
          journalTitleRef={journalTitleRef}
          prayedDeckCount={effectivePrayedDeckItems.length}
          pastoralReviewCount={effectivePastoralReviewItems.length}
          activeRoleLabel={activeRoleConfig.label}
          dailyDevotion={dailyDevotion}
          dailyTeaching={dailyTeaching}
          homeContentStatus={homeContentStatus}
          onNavigate={setCurrentView}
        />
      ) : null}

      {currentView === 'dashboard' ? (
        <>
          <HeroPanel
            answeredCount={answeredFocusItems.length}
            completedCount={completedFocusItems}
            activeCount={activeFocusItems.length}
            requestInputRef={requestInputRef}
            journalTitleRef={journalTitleRef}
          />

          <section className="content-grid">
            {showSwipeQueue ? (
              <SwipeQueuePanel
                prayerQueueLength={effectivePrayerQueue.length}
                currentDeckCard={currentDeckCard}
                nextDeckCard={nextDeckCard}
                prayedDeckCount={effectivePrayedDeckItems.length}
                pastoralReviewCount={effectivePastoralReviewItems.length}
                lastDeckAction={lastDeckAction}
                swipeIntent={swipeIntent}
                swipeCardTransform={swipeCardTransform}
                onDeckDecision={handleDeckDecision}
                onSendToReview={handleSendCurrentDeckToReview}
                onPointerDown={handleDeckPointerDown}
                onPointerMove={handleDeckPointerMove}
                onPointerUp={handleDeckPointerUp}
                onPointerCancel={handleDeckPointerCancel}
              />
            ) : null}
            <AnalyticsDashboard
              activeRoleLabel={activeRoleConfig.label}
              openRequests={activeFocusItems.length}
              answeredRequests={answeredFocusItems.length}
              prayedCoverageCount={prayedCoverageCount}
              followUpRequestedCount={followUpRequestedCount}
              sensitivePendingCount={sensitivePendingCount}
              testimonySharedCount={testimonySharedCount}
              answerRate={answerRate}
              sharedPrayerRequestsEnabled={sharedPrayerRequestsEnabled}
            />
            {showPastoralReview ? (
              <PastoralReviewPanel
                pastoralReviewItems={effectivePastoralReviewItems}
                handleReturnToQueue={handleReturnToQueue}
                handleApproveReview={handleApproveReview}
              />
            ) : null}
            {showTeamSpaces ? (
              <TeamSpacesPanels
                intercessorSpaces={intercessorSpaces}
                prayerCoreSpaces={prayerCoreSpaces}
                activeRole={activeRole}
              />
            ) : null}
            {showPrayerRhythm ? <PrayerRhythmPanel prayerMoments={prayerMoments} /> : null}
            <PrayerListPanel
              activeFocusItemsCount={activeFocusItems.length}
              requestText={requestText}
              requestInputRef={requestInputRef}
              setRequestText={setRequestText}
              requestIsAnonymous={requestIsAnonymous}
              setRequestIsAnonymous={setRequestIsAnonymous}
              requestVisibilityScope={requestVisibilityScope}
              setRequestVisibilityScope={setRequestVisibilityScope}
              memberDisplayName={memberDisplayName}
              authUserId={authUserId}
              handleAddPrayerRequest={handleAddPrayerRequest}
              filterOptions={filterOptions}
              focusFilter={focusFilter}
              setFocusFilter={setFocusFilter}
              filteredFocusItems={filteredFocusItems}
              handleToggleFocusItem={handleToggleFocusItem}
              handleMarkAnswered={handleMarkAnswered}
              handleToggleFollowUp={handleToggleFollowUp}
              followUpDrafts={followUpDrafts}
              handleFollowUpDraftChange={handleFollowUpDraftChange}
              handleAddFollowUpMessage={handleAddFollowUpMessage}
              handleRemoveFocusItem={handleRemoveFocusItem}
              requestSyncStatus={effectiveRequestSyncStatus}
              requestSyncTone={effectiveRequestSyncTone}
              canRemoveRequests={canRemoveRequests}
              canManagePrayerWorkflow={canManagePrayerWorkflow}
            />
            <AnsweredPrayersPanel
              answeredFocusItems={answeredFocusItems}
              authUserId={authUserId}
              canManagePrayerWorkflow={canManagePrayerWorkflow}
              handleRestoreAnswered={handleRestoreAnswered}
              handleAnsweredNoteChange={handleAnsweredNoteChange}
              testimonyDrafts={testimonyDrafts}
              handleTestimonyDraftChange={handleTestimonyDraftChange}
              handleTestimonyShareChange={handleTestimonyShareChange}
              handleSaveTestimony={handleSaveTestimony}
            />
            <JournalPanel
              journalItems={journalItems}
              journalForm={journalForm}
              journalTitleRef={journalTitleRef}
              handleJournalChange={handleJournalChange}
              handleAddJournalEntry={handleAddJournalEntry}
              handleRemoveJournalEntry={handleRemoveJournalEntry}
              journalSyncStatus={effectiveJournalSyncStatus}
              journalSyncTone={effectiveJournalSyncTone}
            />
            <VersePanel />
          </section>
        </>
      ) : null}

      {currentView === 'bible' ? <BibleView /> : null}

      {currentView === 'profile' ? (
        <ProfileView
          authSession={authSession}
          activeRoleConfig={activeRoleConfig}
          activeCount={activeFocusItems.length}
          answeredCount={answeredFocusItems.length}
          journalCount={journalItems.length}
          memberProfile={memberProfile}
          memberProfileForm={memberProfileForm}
          memberProfileStatus={memberProfileStatus}
          authBusy={authBusy}
          handleMemberProfileChange={handleMemberProfileChange}
          handleMemberAvatarChange={handleMemberAvatarChange}
          handleSaveMemberProfile={handleSaveMemberProfile}
          canManageTeaching={canManageTeaching}
          teachingForm={teachingForm}
          teachingStatus={teachingStatus}
          teachingTone={teachingTone}
          handleTeachingChange={handleTeachingChange}
          handleSaveTeaching={handleSaveTeaching}
          canManageMembers={canManageMembers}
          members={memberDirectoryItems}
          memberDirectoryBusy={memberDirectoryBusy}
          memberDirectoryStatus={memberDirectoryStatus}
          memberDirectoryTone={memberDirectoryTone}
          handleRefreshMemberDirectory={handleRefreshMemberDirectory}
          handleUpdateMemberRole={handleUpdateMemberRole}
          roleOptions={roleOptions}
        />
      ) : null}

      {currentView === 'praises' ? (
        <PraisesView
          answeredFocusItems={answeredFocusItems}
          authUserId={authUserId}
          canManagePrayerWorkflow={canManagePrayerWorkflow}
          handleRestoreAnswered={handleRestoreAnswered}
          handleAnsweredNoteChange={handleAnsweredNoteChange}
          testimonyDrafts={testimonyDrafts}
          handleTestimonyDraftChange={handleTestimonyDraftChange}
          handleTestimonyShareChange={handleTestimonyShareChange}
          handleSaveTestimony={handleSaveTestimony}
          prayedDeckItems={effectivePrayedDeckItems}
        />
      ) : null}
    </main>
  )
}

export default App