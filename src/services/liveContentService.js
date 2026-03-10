import { getDailyHomeContent } from '../data/dailyContent.js'

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
  const response = await fetch('https://beta.ourmanna.com/api/v1/get?format=json&order=daily')

  if (!response.ok) {
    throw new Error('Unable to load the daily devotion feed.')
  }

  const payload = await response.json()
  const details = payload?.verse?.details

  if (!details?.text || !details?.reference) {
    throw new Error('Daily devotion feed returned an incomplete payload.')
  }

  return {
    title: 'Daily verse and devotion',
    scripture: `${details.reference}${details.version ? ` • ${details.version}` : ''}`,
    summary: details.text,
    action: 'Reflect on this verse and turn it into a personal prayer for today.',
    source: payload?.verse?.notice ?? 'OurManna',
    isLive: true,
    link: details.verseurl ?? null,
  }
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