import { NextRequest, NextResponse } from 'next/server'
import { SessionStore } from '@/lib/therapy/session-store'

const sessionStore = new SessionStore()

// Get user's previous sessions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id') || 'default_user'

    const sessions = sessionStore.getUserSessions(userId)
    
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
