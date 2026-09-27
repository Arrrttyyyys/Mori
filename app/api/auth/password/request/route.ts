import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { consumeAuthQuota } from '@/lib/auth/rate-limit'
import { hasSameOrigin } from '@/lib/auth/request-origin'

const genericMessage = 'If an account uses that email, Mori will send a password-reset link.'

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Request origin could not be verified' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  if (typeof body.email !== 'string' || !body.email.trim()) return NextResponse.json({ error: 'Enter your email address' }, { status: 400 })
  const quota = await consumeAuthQuota(request, 'recovery_request', body.email).catch(() => null)
  if (!quota) return NextResponse.json({ error: 'Password recovery is temporarily unavailable' }, { status: 503 })
  if (!quota.allowed) return NextResponse.json({ error: 'Too many reset requests. Please wait before trying again.' }, { status: 429, headers: { 'Retry-After': String(quota.retryAfter) } })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 })
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  await supabase.auth.resetPasswordForEmail(body.email.trim(), { redirectTo: `${request.headers.get('origin')}/auth/reset-password` })
  return NextResponse.json({ message: genericMessage })
}
