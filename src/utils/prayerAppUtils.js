export function loadStoredItems(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const storedValue = window.localStorage.getItem(key)

    if (!storedValue) {
      return fallback
    }

    const parsedValue = JSON.parse(storedValue)
    return Array.isArray(parsedValue) ? parsedValue : fallback
  } catch {
    return fallback
  }
}

export function createId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

export function formatEntryDate() {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date())
}

export function formatAnsweredDate() {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date())
}

export function normalizeFocusItems(items) {
  return items.map((item) => ({
    id: item.id ?? createId('focus'),
    label: item.label ?? '',
    completed: Boolean(item.completed),
    answeredAt: item.answeredAt ?? null,
    answeredNote: item.answeredNote ?? '',
    requestedBy: item.requestedBy ?? 'Community member',
    isAnonymous: Boolean(item.isAnonymous),
    workflowStatus: item.workflowStatus ?? 'queue',
    category: item.category ?? 'Community care',
    confidentiality: item.confidentiality ?? 'Intercessor safe',
    submittedBy: item.submittedBy ?? 'Prayer app',
    assignedTo: item.assignedTo ?? 'Open team',
    flaggedAt: item.flaggedAt ?? null,
    prayedAt: item.prayedAt ?? null,
  }))
}

export function normalizePrayerDeck(items) {
  return items.map((item) => ({
    id: item.id ?? createId('deck'),
    focusItemId: item.focusItemId ?? null,
    name: item.name ?? 'Anonymous request',
    requestedBy: item.requestedBy ?? item.name ?? 'Anonymous request',
    isAnonymous: Boolean(item.isAnonymous),
    request: item.request ?? '',
    category: item.category ?? 'General',
    confidentiality: item.confidentiality ?? 'Intercessor safe',
    submittedBy: item.submittedBy ?? 'Prayer app',
    assignedTo: item.assignedTo ?? 'Open team',
    flaggedAt: item.flaggedAt ?? null,
    prayedAt: item.prayedAt ?? null,
  }))
}