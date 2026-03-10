import { getDailyHomeContent } from '../data/dailyContent.js'

const dailyDevotionCacheStorageKey = 'prayer-app-daily-devotion-cache'

function getTodayCacheKey() {
  return new Date().toISOString().slice(0, 10)
}

function readCachedDevotion() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storedValue = window.localStorage.getItem(dailyDevotionCacheStorageKey)

    if (!storedValue) {
      return null
    }

    const parsedValue = JSON.parse(storedValue)

    if (parsedValue?.cacheKey !== getTodayCacheKey() || !parsedValue?.devotion) {
      return null
    }

    return parsedValue.devotion
  } catch {
    return null
  }
}

function writeCachedDevotion(devotion) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    dailyDevotionCacheStorageKey,
    JSON.stringify({
      cacheKey: getTodayCacheKey(),
      devotion,
    }),
  )
}

function buildFallbackContent() {
  const { devotion, teaching } = getDailyHomeContent()

  return {
    devotion: {
      ...devotion,
      source: 'Curated fallback',
      isLive: false,
      link: null,
    },
    teaching: {
      ...teaching,
      source: 'Curated fallback',
      isLive: false,
      link: null,
    },
  }
}

async function fetchDailyDevotion() {
  const cachedDevotion = readCachedDevotion()

  if (cachedDevotion) {
    return cachedDevotion
  }

  const response = await fetch('https://beta.ourmanna.com/api/v1/get?format=json&order=daily')

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Daily devotion feed is rate-limited right now.')
    }

    throw new Error('Unable to load the daily devotion feed.')
  }

  const payload = await response.json()
  const details = payload?.verse?.details

  if (!details?.text || !details?.reference) {
    throw new Error('Daily devotion feed returned an incomplete payload.')
  }

  const devotion = {
    title: 'Daily verse and devotion',
    scripture: `${details.reference}${details.version ? ` • ${details.version}` : ''}`,
    summary: details.text,
    action: 'Reflect on this verse and turn it into a personal prayer for today.',
    source: payload?.verse?.notice ?? 'OurManna',
    isLive: true,
    link: details.verseurl ?? null,
  }

  writeCachedDevotion(devotion)

  return devotion
}

export async function getLiveHomeContent() {
  const fallback = buildFallbackContent()

  const devotionResult = await Promise.allSettled([fetchDailyDevotion()])

  return {
    devotion:
      devotionResult[0].status === 'fulfilled' ? devotionResult[0].value : fallback.devotion,
    teaching: fallback.teaching,
  }
}