import { NextRequest, NextResponse } from 'next/server'
import { SessionStore } from '@/lib/therapy/session-store'
import { authErrorResponse, requireRequestIdentity } from '@/lib/auth/server-auth'
import { SupabaseSessionStore } from '@/lib/therapy/supabase-session-store'

export const dynamic = 'force-dynamic'

const sessionStore = new SessionStore()

// Get user's previous sessions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const requestedUserId = searchParams.get('user_id') ?? undefined
    const identity = await requireRequestIdentity(request, requestedUserId)

    const sessions = identity.mode === 'demo' ? sessionStore.getUserSessions(identity.userId) : await new SupabaseSessionStore(identity.client, identity.userId).getUserSessions()
    
    return NextResponse.json({ sessions })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
