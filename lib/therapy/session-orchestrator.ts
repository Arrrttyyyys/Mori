import { TherapySession, SessionTurn, TherapyResponse, PhotoMetadata, MemoryLibraryItem, FamilySpaceContext } from './types'
import { TherapyBrain } from './therapy-brain'
import { SafetyMonitor } from './safety-monitor'

export interface ExtraSessionContext {
  session_plan?: string
  previous_sessions_summary?: string
  memory_library?: MemoryLibraryItem[]
  family_space?: FamilySpaceContext
}

export class SessionOrchestrator {
  private therapyBrain: TherapyBrain
  private safetyMonitor: SafetyMonitor
  private maxTurnsBeforeClose = 16
  private minTurnsBeforeClose = 8

  constructor() {
    this.therapyBrain = new TherapyBrain()
    this.safetyMonitor = new SafetyMonitor()
  }

  async processTurn(
    session: TherapySession,
    userMessage: string,
    photoMetadata?: PhotoMetadata,
    extraContext?: ExtraSessionContext
  ): Promise<TherapyResponse> {
    if (this.wantsToEndSession(userMessage, Boolean(session.close_offer_turn))) {
      const closure = this.getSessionClosureResponse()
      this.addTurn(session, userMessage, closure, photoMetadata?.photo_id)
      session.status = 'closed'
      return closure
    }

    // Safety check first
    const safetyCheck = this.safetyMonitor.checkSafety(userMessage)
    
    if (!safetyCheck.isSafe) {
      const safetyResponse = this.safetyMonitor.getSafetyResponse(
        safetyCheck.riskLevel,
        safetyCheck.flags
      )
      safetyResponse.safety = {
        risk_level: safetyCheck.riskLevel,
        flags: safetyCheck.flags,
        supervisor_attention: safetyCheck.riskLevel !== 'low',
      }
      
      // Store the turn
      this.addTurn(session, userMessage, safetyResponse, photoMetadata?.photo_id)
      this.updateSessionMetadata(session, safetyResponse)
      
      // Escalate if needed
      if (this.safetyMonitor.shouldEscalate(safetyCheck.riskLevel)) {
        // In production, trigger escalation hook
        console.warn('SAFETY ESCALATION NEEDED:', safetyCheck.flags)
      }
      
      return safetyResponse
    }

    if (session.close_offer_turn) {
      session.close_offer_turn = null
    }

    // Generate therapy response with full context (memory library, family space, previous sessions)
    const context = {
      session,
      session_plan: extraContext?.session_plan,
      photo_metadata: photoMetadata,
      previous_sessions_summary: extraContext?.previous_sessions_summary,
      memory_library: extraContext?.memory_library,
      family_space: extraContext?.family_space,
    }

    const response = await this.therapyBrain.generateResponse(userMessage, context)

    // Store the turn
    this.addTurn(session, userMessage, response, photoMetadata?.photo_id)

    // Update session metadata
    this.updateSessionMetadata(session, response)

    if (this.shouldOfferClose(session, userMessage) && response.session_action !== 'close') {
      response.spoken_response = `${response.spoken_response} I've enjoyed spending this time with you.`
      response.next_question = 'Would you like to keep talking, or finish for today?'
      session.close_offer_turn = session.turns.length
    }

    return response
  }

  private addTurn(
    session: TherapySession,
    userMessage: string,
    therapistResponse: TherapyResponse,
    photoId?: string | null
  ): void {
    const turn: SessionTurn = {
      user_message: userMessage,
      therapist_response: therapistResponse,
      timestamp: new Date(),
      photo_id: photoId || null,
    }

    session.turns.push(turn)
    session.last_activity = new Date()
  }

  private updateSessionMetadata(session: TherapySession, response: TherapyResponse): void {
    // Track emotional states
    if (!session.emotional_states.includes(response.emotional_state)) {
      session.emotional_states.push(response.emotional_state)
    }

    // Update current photo
    if (response.show_photo && response.photo_id) {
      session.current_photo_id = response.photo_id
    }
  }

  private shouldOfferClose(session: TherapySession, userMessage: string): boolean {
    if (/\b(tired|sleepy|exhausted|need (?:a )?rest)\b/i.test(userMessage)) return true
    const turnCount = session.turns.length
    const directQuestion = /\?|\b(who|what|when|where|why|how|can you|do you|are you|tell me)\b/i.test(userMessage)
    return turnCount >= this.minTurnsBeforeClose && turnCount % 8 === 0 && !session.close_offer_turn && !directQuestion
  }

  private wantsToEndSession(message: string, answeringCloseOffer: boolean): boolean {
    if (/^(?:please )?(?:stop|enough|no more|i want to stop)[.! ]*$/i.test(message.trim())) return true
    if (/\b(goodbye|bye|end the session|finish(?:ed)? for today|done for today|stop now|no more|that's all|that is all)\b/i.test(message)) {
      return true
    }
    return answeringCloseOffer && /^(no|stop|finish|done|end)(?:[.! ]|$)/i.test(message.trim())
  }

  getSessionClosureResponse(): TherapyResponse {
    return {
      spoken_response: "Thank you for sharing these memories with me today. I really enjoyed listening. We can talk again whenever you'd like.",
      next_question: "",
      show_photo: false,
      photo_id: null,
      emotional_state: 'calm',
      session_action: 'close',
    }
  }

  shouldCloseSession(session: TherapySession): boolean {
    const duration = Date.now() - session.started_at.getTime()
    const maxDuration = 20 * 60 * 1000 // 20 minutes
    
    return (
      duration > maxDuration ||
      session.turns.length >= this.maxTurnsBeforeClose ||
      session.status === 'closed'
    )
  }
}
