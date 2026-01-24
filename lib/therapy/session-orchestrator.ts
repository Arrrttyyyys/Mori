import { TherapySession, SessionTurn, TherapyResponse, PhotoMetadata } from './types'
import { TherapyBrain } from './therapy-brain'
import { SafetyMonitor } from './safety-monitor'

export class SessionOrchestrator {
  private therapyBrain: TherapyBrain
  private safetyMonitor: SafetyMonitor
  private maxTurnsBeforeClose = 6
  private minTurnsBeforeClose = 3

  constructor() {
    this.therapyBrain = new TherapyBrain()
    this.safetyMonitor = new SafetyMonitor()
  }

  async processTurn(
    session: TherapySession,
    userMessage: string,
    photoMetadata?: PhotoMetadata
  ): Promise<TherapyResponse> {
    // Safety check first
    const safetyCheck = this.safetyMonitor.checkSafety(userMessage)
    
    if (!safetyCheck.isSafe) {
      const safetyResponse = this.safetyMonitor.getSafetyResponse(
        safetyCheck.riskLevel,
        safetyCheck.flags
      )
      
      // Store the turn
      this.addTurn(session, userMessage, safetyResponse, photoMetadata?.photo_id)
      
      // Escalate if needed
      if (this.safetyMonitor.shouldEscalate(safetyCheck.riskLevel)) {
        // In production, trigger escalation hook
        console.warn('SAFETY ESCALATION NEEDED:', safetyCheck.flags)
      }
      
      return safetyResponse
    }

    // Check if session should close
    if (this.shouldOfferClose(session)) {
      return this.getCloseOfferResponse()
    }

    // Generate therapy response
    const context = {
      session,
      photo_metadata: photoMetadata,
    }

    const response = await this.therapyBrain.generateResponse(userMessage, context)

    // Store the turn
    this.addTurn(session, userMessage, response, photoMetadata?.photo_id)

    // Update session metadata
    this.updateSessionMetadata(session, response)

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

  private shouldOfferClose(session: TherapySession): boolean {
    const turnCount = session.turns.length
    return turnCount >= this.minTurnsBeforeClose && turnCount % 3 === 0
  }

  private getCloseOfferResponse(): TherapyResponse {
    return {
      spoken_response: "We've been talking for a while. I've really enjoyed listening to your stories.",
      next_question: "Would you like to continue?",
      show_photo: false,
      photo_id: null,
      emotional_state: 'reflective',
      session_action: 'continue',
    }
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
      session.turns.length > this.maxTurnsBeforeClose ||
      session.status === 'closed'
    )
  }
}
