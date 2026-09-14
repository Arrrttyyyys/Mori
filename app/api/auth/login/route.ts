import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { setAuthCookies } from '@/lib/auth/cookies'

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ error: 'Request origin could not be verified' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  if (typeof body.email !== 'string' || typeof body.password !== 'string') return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 })
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await supabase.auth.signInWithPassword({ email: body.email.trim(), password: body.password })
  if (error || !data.session) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  const response = NextResponse.json({ user: data.user })
  setAuthCookies(response, data.session)
  return response
}
