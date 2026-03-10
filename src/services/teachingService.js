import { getDayIndex, teachingLibrary } from '../data/dailyContent.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import { normalizeSupabaseSyncError } from './supabaseSyncUtils.js'

const dailyTeachingsTable = 'daily_teachings'

function getTodayDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function normalizeTeachingRow(row) {
  return {
    id: row.id,
    publishDate: row.publish_date,
    title: row.title ?? '',
    speaker: row.speaker ?? '',
    theme: row.theme ?? '',
    summary: row.summary ?? '',
    source: row.source ?? 'Supabase teaching feed',
    isLive: true,
    link: row.link ?? null,
  }
}

function buildTeachingPayload(teaching) {
  return {
    publish_date: teaching.publishDate,
    title: teaching.title,
    speaker: teaching.speaker,
    theme: teaching.theme,
    summary: teaching.summary,
    source: teaching.source,
    link: teaching.link ?? null,
  }
}

export const isTeachingSyncConfigured = isSupabaseConfigured

export function getFallbackTeaching(date = new Date()) {
  const teaching = teachingLibrary[getDayIndex(date, teachingLibrary.length)]

  return {
    ...teaching,
    publishDate: getTodayDateKey(date),
    source: 'Curated fallback',
    isLive: false,
    link: null,
  }
}

export async function getFeaturedTeaching(date = new Date()) {
  if (!supabase || !isTeachingSyncConfigured) {
    return { item: getFallbackTeaching(date), error: null }
  }

  try {
    const todayKey = getTodayDateKey(date)
    const { data, error } = await supabase
      .from(dailyTeachingsTable)
      .select('id, publish_date, title, speaker, theme, summary, source, link')
      .lte('publish_date', todayKey)
      .order('publish_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return { item: getFallbackTeaching(date), error: normalizeSupabaseSyncError(error, 'daily teaching') }
    }

    if (!data) {
      return { item: getFallbackTeaching(date), error: null }
    }

    return { item: normalizeTeachingRow(data), error: null }
  } catch (error) {
    return { item: getFallbackTeaching(date), error: normalizeSupabaseSyncError(error, 'daily teaching') }
  }
}

export async function saveFeaturedTeaching(teaching) {
  if (!supabase || !isTeachingSyncConfigured) {
    return { item: { ...teaching, isLive: false }, error: null }
  }

  try {
    const { data, error } = await supabase
      .from(dailyTeachingsTable)
      .upsert(buildTeachingPayload(teaching), { onConflict: 'publish_date' })
      .select('id, publish_date, title, speaker, theme, summary, source, link')
      .single()

    if (error) {
      return { item: null, error: normalizeSupabaseSyncError(error, 'daily teaching') }
    }

    return { item: normalizeTeachingRow(data), error: null }
  } catch (error) {
    return { item: null, error: normalizeSupabaseSyncError(error, 'daily teaching') }
  }
}

export function subscribeToFeaturedTeaching(onItemChange, onError) {
  if (!supabase || !isTeachingSyncConfigured) {
    return () => {}
  }

  const channel = supabase
    .channel('daily-teachings-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: dailyTeachingsTable },
      async () => {
        const { item, error } = await getFeaturedTeaching()

        if (error) {
          onError?.(error)
          return
        }

        onItemChange(item)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}