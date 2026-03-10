export function isTransientSupabaseError(error) {
  const message = error?.message?.toLowerCase?.() ?? error?.toLowerCase?.() ?? ''

  return (
    message.includes('unable to reach supabase') ||
    message.includes('connection problem') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed') ||
    message.includes('fetch failed')
  )
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

  if (
    normalizedMessage.includes('jwt') ||
    normalizedMessage.includes('session') ||
    normalizedMessage.includes('token')
  ) {
    return `Your Supabase session for ${resourceLabel} needs to be refreshed. Sign out and sign back in.`
  }

  return message
}