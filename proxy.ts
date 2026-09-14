import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ACCESS_COOKIE, REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from '@/lib/auth/cookies'

function expiresSoon(token: string) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    return typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000) + 60
  } catch {
    return true
  }
}

export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value
  if (!refresh || (access && !expiresSoon(access))) return NextResponse.next()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.next()
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refresh })
  if (error || !data.session) {
    const response = NextResponse.next()
    clearAuthCookies(response)
    return response
  }
  request.cookies.set(ACCESS_COOKIE, data.session.access_token)
  request.cookies.set(REFRESH_COOKIE, data.session.refresh_token)
  const response = NextResponse.next({ request })
  setAuthCookies(response, data.session)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
