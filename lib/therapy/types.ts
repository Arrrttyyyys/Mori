export interface TherapyResponse {
  spoken_response: string
  next_question: string
  show_photo: boolean
  photo_id: string | null
  emotional_state: 'calm' | 'reflective' | 'nostalgic' | 'confused' | 'distressed' | 'joyful'
  session_action: 'continue' | 'close'
  safety?: {
    risk_level: 'low' | 'medium' | 'high'
    flags: string[]
    supervisor_attention: boolean
  }
}

export interface PhotoMetadata {
  photo_id: string
  people?: string[]
  place?: string
  year?: string
  memory_hint?: string
}

export interface SessionTurn {
  user_message: string
  therapist_response: TherapyResponse
  timestamp: Date
  photo_id?: string | null
}

export interface TherapySession {
  session_id: string
  user_id: string
  turns: SessionTurn[]
  current_photo_id: string | null
  emotional_states: string[]
  topics_discussed: string[]
  started_at: Date
  last_activity: Date
  status: 'active' | 'closed'
  close_offer_turn?: number | null
}

/** Memory Library item (titles/dates only for LLM context; no image data) */
export interface MemoryLibraryItem {
  id: string | number
  title: string
  date: string
  image?: string
}

/** Family Space context for Mori */
export interface FamilySpaceContext {
  session_summaries?: Array<{ date: string; topic: string; summary: string }>
  reflections?: Array<{ text: string }>
}

export interface SessionContext {
  session_plan?: string
  session: TherapySession
  photo_metadata?: PhotoMetadata
  previous_sessions_summary?: string
  memory_library?: MemoryLibraryItem[]
  family_space?: FamilySpaceContext
}
