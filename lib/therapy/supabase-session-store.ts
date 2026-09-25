import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { TherapyResponse, TherapySession } from './types'

function mapSession(row: any, turns: any[] = []): TherapySession {
  return {
    session_id: row.id,
    user_id: row.owner_id,
    turns: turns.map((turn) => ({
      user_message: turn.user_message,
      therapist_response: {
        spoken_response: turn.spoken_response,
        next_question: turn.next_question,
        show_photo: turn.show_photo,
        photo_id: turn.memory_id,
        emotional_state: turn.emotional_state,
        session_action: turn.session_action,
      } as TherapyResponse,
      timestamp: new Date(turn.created_at),
      photo_id: turn.memory_id,
    })),
    current_photo_id: row.current_memory_id,
    pending_memory_id: row.pending_memory_id ?? null,
    emotional_states: row.emotional_states ?? [],
    topics_discussed: row.topics_discussed ?? [],
    started_at: new Date(row.started_at),
    last_activity: new Date(row.last_activity_at),
    status: row.status,
    close_offer_turn: row.close_offer_turn ?? null,
  }
}

export class SupabaseSessionStore {
  constructor(private client: SupabaseClient, private userId: string) {}

  async createSession(): Promise<TherapySession> {
    const { data, error } = await this.client.from('therapy_sessions').insert({ owner_id: this.userId }).select('*').single()
    if (error) throw error
    return mapSession(data)
  }

  async getSession(sessionId: string): Promise<TherapySession | null> {
    const [sessionResult, turnsResult] = await Promise.all([
      this.client.from('therapy_sessions').select('*').eq('id', sessionId).eq('owner_id', this.userId).maybeSingle(),
      this.client.from('session_turns').select('*').eq('session_id', sessionId).eq('owner_id', this.userId).order('turn_index'),
    ])
    if (sessionResult.error) throw sessionResult.error
    if (turnsResult.error) throw turnsResult.error
    return sessionResult.data ? mapSession(sessionResult.data, turnsResult.data ?? []) : null
  }

  async updateSession(session: TherapySession): Promise<void> {
    const closedAt = session.status === 'closed' ? new Date().toISOString() : null
    const { error } = await this.client.from('therapy_sessions').update({
      status: session.status,
      current_memory_id: session.current_photo_id,
      pending_memory_id: session.pending_memory_id ?? null,
      emotional_states: session.emotional_states,
      topics_discussed: session.topics_discussed,
      close_offer_turn: session.close_offer_turn ?? null,
      last_activity_at: session.last_activity.toISOString(),
      closed_at: closedAt,
    }).eq('id', session.session_id).eq('owner_id', this.userId)
    if (error) throw error

    const turn = session.turns.at(-1)
    if (!turn) return
    const response = turn.therapist_response
    const { error: turnError } = await this.client.from('session_turns').upsert({
      session_id: session.session_id,
      owner_id: this.userId,
      turn_index: session.turns.length - 1,
      user_message: turn.user_message,
      spoken_response: response.spoken_response,
      next_question: response.next_question,
      show_photo: response.show_photo,
      memory_id: turn.photo_id || null,
      emotional_state: response.emotional_state,
      session_action: response.session_action,
      created_at: turn.timestamp.toISOString(),
    }, { onConflict: 'session_id,turn_index' })
    if (turnError) throw turnError
  }

  async closeSession(sessionId: string): Promise<void> {
    const { error } = await this.client.from('therapy_sessions').update({ status: 'closed', closed_at: new Date().toISOString(), last_activity_at: new Date().toISOString() }).eq('id', sessionId).eq('owner_id', this.userId)
    if (error) throw error
  }

  async getUserSessions(): Promise<TherapySession[]> {
    const { data, error } = await this.client.from('therapy_sessions').select('*').eq('owner_id', this.userId).order('started_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => mapSession(row))
  }

  async getPreviousSessionsSummary(currentSessionId: string): Promise<string> {
    const { data, error } = await this.client.from('session_summaries').select('topic, summary, created_at, session_id').eq('owner_id', this.userId).neq('session_id', currentSessionId).order('created_at', { ascending: false }).limit(3)
    if (error) throw error
    return (data ?? []).map((item) => `${new Date(item.created_at).toLocaleDateString()}: ${item.topic} — ${item.summary}`).join('; ')
  }
}
