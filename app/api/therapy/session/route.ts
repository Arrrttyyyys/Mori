import { NextRequest, NextResponse } from 'next/server'
import { SessionOrchestrator } from '@/lib/therapy/session-orchestrator'
import { SessionStore } from '@/lib/therapy/session-store'
import { TherapySession } from '@/lib/therapy/types'
import { MemoryLibraryItem } from '@/lib/therapy/types'
import { getMemories, getFamilySpace } from '@/lib/user-data-store'

const sessionStore = new SessionStore()
const orchestrator = new SessionOrchestrator()

// Get or create session
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')
    const userId = searchParams.get('user_id') || 'default_user'

    if (sessionId) {
      const session = sessionStore.getSession(sessionId)
      if (session) {
        return NextResponse.json({ session })
      }
    }

    // Create new session
    const newSession = sessionStore.createSession(userId)
    return NextResponse.json({ session: newSession })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

// Process a turn in the session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, user_message, photo_metadata } = body

    console.log('📥 POST /api/therapy/session - session_id:', session_id, 'user_message:', user_message?.substring(0, 50))

    if (!session_id || !user_message) {
      console.error('❌ Missing required fields:', { session_id: !!session_id, user_message: !!user_message })
      return NextResponse.json(
        { error: 'session_id and user_message are required' },
        { status: 400 }
      )
    }

    const session = sessionStore.getSession(session_id)
    if (!session) {
      console.error('❌ Session not found:', session_id)
      // Try to create a new session if it doesn't exist
      const userId = body.user_id || 'default_user'
      console.log('🆕 Creating new session for user:', userId)
      const newSession = sessionStore.createSession(userId)
      console.log('✅ Created session:', newSession.session_id)
      return NextResponse.json(
        { error: 'Session not found, please refresh and try again', new_session_id: newSession.session_id },
        { status: 404 }
      )
    }

    console.log('✅ Session found:', session.session_id)

    // Get previous sessions summary for context
    const previousSessionsSummary = sessionStore.getPreviousSessionsSummary(
      session.user_id,
      session.session_id
    )

    // Load Memory Library and Family Space for this account from backend store
    const storedMemories = getMemories(session.user_id)
    const memory_library: MemoryLibraryItem[] = storedMemories.map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date,
    }))
    const family_space = getFamilySpace(session.user_id)

    const extraContext = {
      previous_sessions_summary: previousSessionsSummary,
      memory_library: memory_library.length > 0 ? memory_library : undefined,
      family_space,
    }

    // Process the turn
    console.log('🔄 Processing turn with orchestrator...')
    const response = await orchestrator.processTurn(
      session,
      user_message,
      photo_metadata,
      extraContext
    )
    console.log('✅ Orchestrator response:', JSON.stringify(response, null, 2))

    // Update session
    sessionStore.updateSession(session)

    // Check if session should close
    if (orchestrator.shouldCloseSession(session) || response.session_action === 'close') {
      console.log('🔚 Closing session')
      sessionStore.closeSession(session_id)
      const closureResponse = orchestrator.getSessionClosureResponse()
      return NextResponse.json({
        response: closureResponse,
        session: session,
      })
    }

    console.log('✅ Returning response to client')
    return NextResponse.json({
      response,
      session: session,
    })
  } catch (error) {
    console.error('❌ Turn processing error:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack)
    }
    return NextResponse.json(
      { error: 'Failed to process turn', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Close session
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      )
    }

    sessionStore.closeSession(sessionId)
    const orchestrator = new SessionOrchestrator()
    const closureResponse = orchestrator.getSessionClosureResponse()

    return NextResponse.json({
      message: 'Session closed',
      closure_response: closureResponse,
    })
  } catch (error) {
    console.error('Session closure error:', error)
    return NextResponse.json(
      { error: 'Failed to close session' },
      { status: 500 }
    )
  }
}
