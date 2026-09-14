import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_COOKIE, clearAuthCookies } from '@/lib/auth/cookies'
import { createUserServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value
  if (!token) return NextResponse.json({ user: null }, { status: 401 })
  try {
    const { data, error } = await createUserServerClient(token).auth.getUser()
    if (error || !data.user) throw error || new Error('Invalid session')
    return NextResponse.json({ user: data.user })
  } catch {
    const response = NextResponse.json({ user: null }, { status: 401 })
    clearAuthCookies(response)
    return response
  }
}
