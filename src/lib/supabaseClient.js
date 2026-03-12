import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim()

function isPlaceholderValue(value) {
  if (!value) {
    return true
  }

  const normalizedValue = value.toLowerCase()

  return (
    normalizedValue.includes('your-project-id') ||
    normalizedValue.includes('your-anon-key') ||
    normalizedValue.includes('example')
  )
}

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  !isPlaceholderValue(supabaseUrl) &&
  !isPlaceholderValue(supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null