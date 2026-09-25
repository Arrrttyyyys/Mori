import { TherapySession, SessionTurn } from './types'

export class SessionStore {
  private sessions: Map<string, TherapySession>

  constructor() {
    const shared = globalThis as typeof globalThis & { __moriDemoSessions?: Map<string, TherapySession> }
    this.sessions = shared.__moriDemoSessions ??= new Map<string, TherapySession>()
  }

  createSession(userId: string): TherapySession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const session: TherapySession = {
      session_id: sessionId,
      user_id: userId,
      turns: [],
      current_photo_id: null,
      pending_memory_id: null,
      emotional_states: [],
      topics_discussed: [],
      started_at: new Date(),
      last_activity: new Date(),
      status: 'active',
      close_offer_turn: null,
    }

    this.sessions.set(sessionId, session)
    return session
  }

  getSession(sessionId: string): TherapySession | null {
    return this.sessions.get(sessionId) || null
  }

  updateSession(session: TherapySession): void {
    this.sessions.set(session.session_id, session)
  }

  closeSession(sessionId: string): void {
    const session = this.getSession(sessionId)
    if (session) {
      session.status = 'closed'
      this.updateSession(session)
    }
  }

  getUserSessions(userId: string): TherapySession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.user_id === userId)
      .sort((a, b) => b.started_at.getTime() - a.started_at.getTime())
  }

  getPreviousSessionsSummary(userId: string, currentSessionId: string): string {
    const previousSessions = this.getUserSessions(userId)
      .filter(session => session.session_id !== currentSessionId && session.status === 'closed')
      .slice(0, 3) // Last 3 sessions

    if (previousSessions.length === 0) {
      return ''
    }

    const summaries = previousSessions.map(session => {
      const topics = session.topics_discussed.slice(0, 2).join(', ')
      return `Session from ${session.started_at.toLocaleDateString()}: discussed ${topics}`
    })

    return summaries.join('; ')
  }

  resetUser(userId: string): void {
    this.sessions.forEach((session, id) => {
      if (session.user_id === userId) this.sessions.delete(id)
    })
  }

  // In production, replace with database persistence
  // For now, this is in-memory storage
}
