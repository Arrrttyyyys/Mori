import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_COOKIE, clearAuthCookies } from '@/lib/auth/cookies'
import { consumeAuthQuota } from '@/lib/auth/rate-limit'
import { authErrorResponse, requireRequestIdentity } from '@/lib/auth/server-auth'
import { createAdminServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const identity = await requireRequestIdentity(request)
    if (identity.mode === 'demo') return NextResponse.json({ error: 'Password changes are unavailable in demo mode' }, { status: 403 })
    const quota = await consumeAuthQuota(request, 'password_update', identity.actorId)
    if (!quota.allowed) return NextResponse.json({ error: 'Too many password attempts. Please wait and try again.' }, { status: 429, headers: { 'Retry-After': String(quota.retryAfter) } })
    const body = await request.json().catch(() => ({}))
    if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128) return NextResponse.json({ error: 'Use a password between 12 and 128 characters' }, { status: 400 })
    const { error } = await identity.client.auth.updateUser({ password: body.password })
    if (error) return NextResponse.json({ error: 'The password could not be updated. Request a new reset link.' }, { status: 400 })
    const token = request.cookies.get(ACCESS_COOKIE)?.value
    if (token) await createAdminServerClient().auth.admin.signOut(token, 'global').catch(() => undefined)
    const response = NextResponse.json({ ok: true })
    clearAuthCookies(response)
    return response
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Password update failed' }, { status: 500 })
  }
}
