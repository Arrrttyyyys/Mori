import type { NextRequest } from 'next/server'

/** Verify browser mutations against the host that received the request.
 * Next's request URL may contain the bound interface (for example 127.0.0.1)
 * even when the browser correctly used localhost, so it is not authoritative.
 */
export function hasSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || !host) return false
  try {
    const originUrl = new URL(origin)
    if (originUrl.host !== host) return false
    if (process.env.NODE_ENV === 'production' && originUrl.protocol !== 'https:') return false
    const fetchSite = request.headers.get('sec-fetch-site')
    return !fetchSite || fetchSite === 'same-origin' || fetchSite === 'none'
  } catch {
    return false
  }
}
