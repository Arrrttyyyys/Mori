import { NextRequest, NextResponse } from 'next/server'
import { hasSameOrigin } from '@/lib/auth/request-origin'
import { anonymousSubjectHash, clientKeyHash } from '@/lib/operations/monitoring'
import { createAdminServerClient } from '@/lib/supabase/server'

const PRIVACY_VERSION = '2026-09-25'
const roles = new Set(['family', 'caregiver', 'older_adult', 'clinician_researcher', 'community_partner', 'other'])

async function consumeQuota(request: NextRequest, email: string) {
  const admin = createAdminServerClient()
  for (const [key, scope, limit] of [
    [clientKeyHash(request), 'client', 10],
    [anonymousSubjectHash(email), 'email', 3],
  ] as const) {
    const { data, error } = await admin.rpc('consume_mori_waitlist_quota', {
      p_subject_key: key,
      p_scope: scope,
      p_window_seconds: 60 * 60,
      p_window_limit: limit,
    })
    if (error) throw error
    const result = data as { allowed?: boolean; retry_after?: number }
    if (!result.allowed) return { allowed: false, retryAfter: Number(result.retry_after || 3600) }
  }
  return { allowed: true, retryAfter: 0 }
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Request origin could not be verified.' }, { status: 403 })
  if (Number(request.headers.get('content-length') || 0) > 16_384) return NextResponse.json({ error: 'The submission is too large.' }, { status: 413 })

  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const role = typeof body.role === 'string' ? body.role : ''
    const interest = typeof body.interest === 'string' ? body.interest.trim() : ''

    // Quietly accept honeypot submissions without storing them.
    if (typeof body.website === 'string' && body.website.trim()) return NextResponse.json({ joined: true })
    if (!body.consent) return NextResponse.json({ error: 'Please agree to receive waitlist updates.' }, { status: 400 })
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    if (name.length > 120 || interest.length > 1000 || !roles.has(role)) return NextResponse.json({ error: 'Review the information and try again.' }, { status: 400 })

    const quota = await consumeQuota(request, email)
    if (!quota.allowed) return NextResponse.json({ error: 'Please wait before trying again.' }, { status: 429, headers: { 'Retry-After': String(quota.retryAfter) } })

    const { error } = await createAdminServerClient().from('waitlist_signups').upsert({
      email,
      name: name || null,
      relationship: role,
      interest: interest || null,
      consented_at: new Date().toISOString(),
      privacy_version: PRIVACY_VERSION,
      source: 'website',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' })
    if (error) throw error
    return NextResponse.json({ joined: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'We could not save your place right now. Please try again later.' }, { status: 503 })
  }
}
