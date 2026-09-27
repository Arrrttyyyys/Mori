import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { setAuthCookies } from '@/lib/auth/cookies'
import { consumeAuthQuota } from '@/lib/auth/rate-limit'
import { hasSameOrigin } from '@/lib/auth/request-origin'

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Request origin could not be verified' }, { status: 403 })
  const quota = await consumeAuthQuota(request, 'confirm').catch(() => null)
  if (!quota) return NextResponse.json({ error: 'Password recovery is temporarily unavailable' }, { status: 503 })
  if (!quota.allowed) return NextResponse.json({ error: 'Too many link attempts. Please wait and try again.' }, { status: 429, headers: { 'Retry-After': String(quota.retryAfter) } })
  const body = await request.json().catch(() => ({}))
  if (body.type !== 'recovery' || typeof body.accessToken !== 'string' || typeof body.refreshToken !== 'string') return NextResponse.json({ error: 'This password-reset link is incomplete or has expired.' }, { status: 400 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 })
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await supabase.auth.setSession({ access_token: body.accessToken, refresh_token: body.refreshToken })
  if (error || !data.session || !data.user) return NextResponse.json({ error: 'This password-reset link is invalid or has expired.' }, { status: 401 })
  const response = NextResponse.json({ ok: true })
  setAuthCookies(response, data.session)
  return response
}
