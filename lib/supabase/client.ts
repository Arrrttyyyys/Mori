import { createClient, SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

/** Get Supabase client for use in the browser. Returns null if env vars are not set. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null
  if (browserClient) return browserClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  browserClient = createClient(url, key)
  return browserClient
}
