import 'server-only'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase is not configured')
  }

  return { url, anonKey }
}

/** A server client scoped to the caller's access token and protected by RLS. */
export function createUserServerClient(accessToken: string): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig()
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** A privileged client for server-owned summary and safety-event writes only. */
export function createAdminServerClient(): SupabaseClient {
  const { url } = getSupabaseConfig()
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
