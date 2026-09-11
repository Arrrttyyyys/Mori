import { TherapyResponse } from './types'

export class SafetyMonitor {
  private distressKeywords = [
    'hurt myself',
    'kill myself',
    'suicide',
    'end it all',
    'want to die',
    'no point',
    'give up',
  ]

  private abuseKeywords = [
    'abuse',
    'hurt me',
    'hit me',
    'threaten',
    'afraid',
    'scared of',
    'locks me in',
    'takes my money',
    'won\'t give me food',
  ]

  private panicKeywords = [
    'panic',
    'can\'t breathe',
    'heart racing',
    'anxiety attack',
    'overwhelmed',
  ]

  private urgentMedicalKeywords = [
    'chest pain',
    'trouble breathing',
    'cannot breathe',
    'can\'t breathe',
    'one side is weak',
    'face is drooping',
    'suddenly confused',
    'sudden confusion',
    'hit my head',
    'fell and hit',
    'won\'t wake up',
    'cannot wake',
    'slurred speech',
    'worst headache',
    'bleeding badly',
    'not responding',
  ]

  checkSafety(userMessage: string): {
    isSafe: boolean
    riskLevel: 'low' | 'medium' | 'high'
    flags: string[]
  } {
    const message = userMessage.toLowerCase()
    const flags: string[] = []

    const urgentMedicalFound = this.urgentMedicalKeywords.some(keyword => message.includes(keyword))
    if (urgentMedicalFound) {
      return {
        isSafe: false,
        riskLevel: 'high',
        flags: ['urgent_medical_concern'],
      }
    }

    // Check for extreme distress
    const distressFound = this.distressKeywords.some(keyword => message.includes(keyword))
    if (distressFound) {
      flags.push('self_harm_ideation')
      return {
        isSafe: false,
        riskLevel: 'high',
        flags,
      }
    }

    // Check for abuse
    const abuseFound = this.abuseKeywords.some(keyword => message.includes(keyword))
    if (abuseFound) {
      flags.push('abuse_concern')
      return {
        isSafe: false,
        riskLevel: 'high',
        flags,
      }
    }

    // Check for panic
    const panicFound = this.panicKeywords.some(keyword => message.includes(keyword))
    if (panicFound) {
      flags.push('panic')
      return {
        isSafe: false,
        riskLevel: 'medium',
        flags,
      }
    }

    // Check for general distress
    const distressIndicators = ['sad', 'depressed', 'lonely', 'hopeless', 'worried']
    const distressCount = distressIndicators.filter(indicator => message.includes(indicator)).length
    if (distressCount >= 2) {
      flags.push('general_distress')
      return {
        isSafe: true,
        riskLevel: 'medium',
        flags,
      }
    }

    return {
      isSafe: true,
      riskLevel: 'low',
      flags: [],
    }
  }

  /** Stable, non-clinical category used by the pilot evaluation harness. */
  classify(userMessage: string): string {
    const result = this.checkSafety(userMessage)
    return result.flags[0] ?? 'none'
  }

  getSafetyResponse(riskLevel: string, flags: string[]): TherapyResponse {
    if (riskLevel === 'high') {
      if (flags.includes('urgent_medical_concern')) {
        return {
          spoken_response: "This may need urgent help. Please get the attention of someone nearby or call your local emergency services now.",
          next_question: "Is someone nearby who can help you?",
          show_photo: false,
          photo_id: null,
          emotional_state: 'distressed',
          session_action: 'continue',
        }
      }

      if (flags.includes('self_harm_ideation')) {
        return {
          spoken_response: "I'm really sorry you're feeling this much pain. Please stay with me and get the attention of someone you trust nearby or contact local emergency services now.",
          next_question: "Are you in immediate danger right now?",
          show_photo: false,
          photo_id: null,
          emotional_state: 'distressed',
          session_action: 'continue',
        }
      }

      return {
        spoken_response: "That sounds frightening. Please get the attention of someone you trust nearby so they can help you feel safe.",
        next_question: "Are you in immediate danger right now?",
        show_photo: false,
        photo_id: null,
        emotional_state: 'distressed',
        session_action: 'continue',
      }
    }

    if (riskLevel === 'medium') {
      return {
        spoken_response: "I can sense this is difficult for you. Thank you for sharing that with me.",
        next_question: "Would you like to continue?",
        show_photo: false,
        photo_id: null,
        emotional_state: 'distressed',
        session_action: 'continue',
      }
    }

    // Low risk - continue normally
    return {
      spoken_response: "I'm here with you.",
      next_question: "What would you like to share?",
      show_photo: false,
      photo_id: null,
      emotional_state: 'calm',
      session_action: 'continue',
    }
  }

  shouldEscalate(riskLevel: string): boolean {
    return riskLevel === 'high'
  }
}
