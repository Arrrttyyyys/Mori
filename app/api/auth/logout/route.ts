import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_COOKIE, clearAuthCookies } from '@/lib/auth/cookies'
import { createAdminServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ error: 'Request origin could not be verified' }, { status: 403 })
  const token = request.cookies.get(ACCESS_COOKIE)?.value
  if (token) await createAdminServerClient().auth.admin.signOut(token, 'local').catch(() => undefined)
  const response = NextResponse.json({ ok: true })
  clearAuthCookies(response)
  return response
}
