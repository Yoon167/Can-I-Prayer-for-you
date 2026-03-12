import { onSnapshot } from 'firebase/firestore'

function getErrorMessage(error) {
  if (typeof error === 'string') {
    return error
  }

  return error?.message ?? error?.code ?? 'Cloud sync is unavailable right now.'
}

export function isTransientFirebaseError(error) {
  const message = getErrorMessage(error).toLowerCase()
  const code = error?.code?.toLowerCase?.() ?? ''

  return (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'resource-exhausted' ||
    code === 'failed-precondition' ||
    code === 'network-request-failed' ||
    message.includes('offline') ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('unavailable') ||
    message.includes('reconnect')
  )
}

export function normalizeFirebaseSyncError(error, resourceLabel) {
  const message = getErrorMessage(error)
  const normalizedMessage = message.toLowerCase()

  if (isTransientFirebaseError(error)) {
    return `Unable to reach Firebase for ${resourceLabel}. The app can keep working on this device until the connection comes back.`
  }

  if (normalizedMessage.includes('permission') || normalizedMessage.includes('missing or insufficient permissions')) {
    return `Firebase denied access to ${resourceLabel}. Review your Firestore security rules and sign in again if your role just changed.`
  }

  if (normalizedMessage.includes('auth') || normalizedMessage.includes('token') || normalizedMessage.includes('credential')) {
    return `Your Firebase session for ${resourceLabel} needs to be refreshed. Sign out and sign back in.`
  }

  return message
}

export function createFirestoreSubscription({ queryRef, resourceLabel, loadLatest, onData, onError }) {
  if (!queryRef) {
    return () => {}
  }

  let refreshInFlight = null
  let refreshQueued = false

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

      if (refreshQueued) {
        refreshQueued = false
        void refreshLatest()
      }
    }
  }

  void refreshLatest()

  return onSnapshot(
    queryRef,
    async () => {
      await refreshLatest()
    },
    (error) => {
      onError?.(normalizeFirebaseSyncError(error, resourceLabel))
    },
  )
}
