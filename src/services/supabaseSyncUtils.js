export function isTransientSupabaseError(error) {
  const message = error?.message?.toLowerCase?.() ?? error?.toLowerCase?.() ?? ''

  return (
    error?.status === 0 ||
    message.includes('unable to reach supabase') ||
    message.includes('connection problem') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed') ||
    message.includes('fetch failed') ||
    message.includes('reconnecting') ||
    message.includes('reconnect') ||
    message.includes('timed out') ||
    message.includes('channel error') ||
    message.includes('socket closed') ||
    message.includes('websocket')
  )
}

function getRealtimeReconnectMessage(resourceLabel) {
  return `Supabase realtime for ${resourceLabel} disconnected and is reconnecting.`
}

export function isSessionSupabaseError(error) {
  const message = error?.message?.toLowerCase?.() ?? error?.toLowerCase?.() ?? ''

  return (
    message.includes('jwt') ||
    message.includes('session') ||
    message.includes('token') ||
    message.includes('refresh') ||
    message.includes('auth session missing')
  )
}

export function shouldRetrySupabaseOperation(error) {
  return isTransientSupabaseError(error) || isSessionSupabaseError(error)
}

export async function retrySupabaseOperation(operation, supabaseClient) {
  let response = await operation()

  if (!response?.error || !shouldRetrySupabaseOperation(response.error)) {
    return response
  }

  if (supabaseClient) {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      if (session) {
        await supabaseClient.auth.refreshSession()
      }
    } catch {
      // Ignore refresh failures and let the retry result surface the real error.
    }
  }

  response = await operation()

  return response
}

export function createResilientRealtimeSubscription({
  supabaseClient,
  channelName,
  table,
  resourceLabel,
  loadLatest,
  onData,
  onError,
}) {
  if (!supabaseClient) {
    return () => {}
  }

  let isActive = true
  let currentChannel = null
  let currentStatus = 'CLOSED'
  let reconnectTimer = null
  let reconnectAttempt = 0
  let refreshInFlight = null
  let refreshQueued = false

  function clearReconnectTimer() {
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  async function refreshLatest() {
    if (refreshInFlight) {
      refreshQueued = true
      return refreshInFlight
    }

    refreshInFlight = (async () => {
      const result = await loadLatest()

      if (result?.error) {
        onError?.(result.error)
        return false
      }

      onData(result)
      return true
    })()

    try {
      return await refreshInFlight
    } finally {
      refreshInFlight = null

      if (refreshQueued && isActive) {
        refreshQueued = false
        void refreshLatest()
      }
    }
  }

  function detachCurrentChannel() {
    if (!currentChannel) {
      return
    }

    supabaseClient.removeChannel(currentChannel)
    currentChannel = null
    currentStatus = 'CLOSED'
  }

  function scheduleReconnect(reasonMessage) {
    if (!isActive || reconnectTimer) {
      return
    }

    onError?.(reasonMessage ?? getRealtimeReconnectMessage(resourceLabel))

    const reconnectDelayMs = Math.min(1000 * 2 ** reconnectAttempt, 15000)
    reconnectAttempt += 1

    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null
      void startSubscription()
    }, reconnectDelayMs)
  }

  async function startSubscription() {
    if (!isActive) {
      return
    }

    clearReconnectTimer()
    detachCurrentChannel()

    currentChannel = supabaseClient
      .channel(`${channelName}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        async () => {
          await refreshLatest()
        },
      )
      .subscribe(async (status, error) => {
        currentStatus = status

        if (!isActive) {
          return
        }

        if (status === 'SUBSCRIBED') {
          reconnectAttempt = 0
          await refreshLatest()
          return
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          scheduleReconnect(
            error?.message ?? getRealtimeReconnectMessage(resourceLabel),
          )
        }
      })
  }

  function handleVisibilityOrOnline() {
    if (!isActive) {
      return
    }

    if (document.visibilityState === 'hidden') {
      return
    }

    if (currentStatus === 'SUBSCRIBED') {
      void refreshLatest()
      return
    }

    scheduleReconnect(getRealtimeReconnectMessage(resourceLabel))
  }

  void startSubscription()

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleVisibilityOrOnline)
    window.addEventListener('focus', handleVisibilityOrOnline)
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityOrOnline)
  }

  return () => {
    isActive = false
    clearReconnectTimer()
    detachCurrentChannel()

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleVisibilityOrOnline)
      window.removeEventListener('focus', handleVisibilityOrOnline)
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityOrOnline)
    }
  }
}

export function normalizeSupabaseSyncError(error, resourceLabel) {
  const message = error?.message ?? error ?? `${resourceLabel} sync is unavailable right now.`
  const normalizedMessage = message.toLowerCase()

  if (isTransientSupabaseError(message)) {
    return `Unable to reach Supabase for ${resourceLabel}. The app can keep working on this device until the connection comes back.`
  }

  if (
    normalizedMessage.includes('row-level security') ||
    normalizedMessage.includes('permission denied') ||
    normalizedMessage.includes('forbidden')
  ) {
    return `Supabase denied access to ${resourceLabel}. Run the latest bootstrap SQL and sign out, then sign back in.`
  }

  if (isSessionSupabaseError(message)) {
    return `Your Supabase session for ${resourceLabel} needs to be refreshed. Sign out and sign back in.`
  }

  return message
}