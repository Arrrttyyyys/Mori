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
  ]

  private panicKeywords = [
    'panic',
    'can\'t breathe',
    'heart racing',
    'anxiety attack',
    'overwhelmed',
  ]

  checkSafety(userMessage: string): {
    isSafe: boolean
    riskLevel: 'low' | 'medium' | 'high'
    flags: string[]
  } {
    const message = userMessage.toLowerCase()
    const flags: string[] = []

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

  getSafetyResponse(riskLevel: string, flags: string[]): TherapyResponse {
    if (riskLevel === 'high') {
      return {
        spoken_response: "I hear that you're going through something very difficult. I want you to know that you're not alone, and there are people who can help.",
        next_question: "I'm here with you. How are you feeling?",
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
