import type { NextResponse } from 'next/server'

export const ACCESS_COOKIE = 'mori_access_token'
export const REFRESH_COOKIE = 'mori_refresh_token'

const baseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  priority: 'high' as const,
}

export function setAuthCookies(
  response: NextResponse,
  session: { access_token: string; refresh_token: string; expires_in?: number },
) {
  response.cookies.set(ACCESS_COOKIE, session.access_token, {
    ...baseOptions,
    maxAge: Math.max(60, session.expires_in ?? 3600),
  })
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
    ...baseOptions,
    maxAge: 60 * 60 * 24 * 30,
  })
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', { ...baseOptions, maxAge: 0 })
  response.cookies.set(REFRESH_COOKIE, '', { ...baseOptions, maxAge: 0 })
}
