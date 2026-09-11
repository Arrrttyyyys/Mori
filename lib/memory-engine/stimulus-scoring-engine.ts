import {
  ConversationState,
  PatientStimulus,
  ScoredStimulus,
  SelectionResult,
  StimulusObservation,
  StimulusScoreBreakdown,
} from './types'

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

/**
 * Selects supportive stimuli with an auditable, deterministic score.
 * This engine never estimates dementia severity or cognitive ability.
 */
export class StimulusScoringEngine {
  score(
    stimulus: PatientStimulus,
    observations: StimulusObservation[],
    state: ConversationState,
    now = new Date()
  ): ScoredStimulus {
    const history = observations.filter((item) => item.stimulusId === stimulus.id)
    const recentHistory = history
      .filter((item) => now.getTime() - item.observedAt.getTime() < 90 * 24 * 60 * 60 * 1000)
      .slice(-8)
    const reasons: string[] = []

    const blockedByConsent = stimulus.consentStatus === 'blocked'
    const needsReview = stimulus.consentStatus === 'review' || stimulus.sensitive
    const caregiverAvoid = recentHistory.some((item) => item.caregiverAssessment === 'avoid')
    const recentHighDistress = recentHistory.some((item) => item.distress >= 0.7)
    const eligible = !blockedByConsent && !needsReview && !caregiverAvoid && !recentHighDistress

    if (blockedByConsent) reasons.push('Blocked by patient consent settings')
    if (needsReview) reasons.push('Requires caregiver review before use')
    if (caregiverAvoid) reasons.push('Caregiver marked this stimulus to avoid')
    if (recentHighDistress) reasons.push('Suppressed after a recent high-distress response')

    const familiarity = clamp(Math.min(history.length, 4) / 4)
    const engagementHistory = recentHistory.length
      ? average(recentHistory.map((item) => clamp(item.engagement)))
      : 0.45
    const meanDistress = average(recentHistory.map((item) => clamp(item.distress)))
    const meanConfusion = average(recentHistory.map((item) => clamp(item.confusion)))
    const emotionalSafety = clamp(1 - Math.max(meanDistress, meanConfusion * 0.6))
    const caregiverSignal = clamp(
      (stimulus.caregiverPriority ?? 0.5) +
      (recentHistory.some((item) => item.caregiverAssessment === 'helpful') ? 0.2 : 0)
    )
    const presentStateFit = clamp(
      1 - state.distress * 0.65 - state.confusion * 0.35 +
      (state.engagement < 0.35 && stimulus.kind === 'photo' ? 0.15 : 0)
    )
    const timesInCurrentWindow = state.recentStimulusIds.filter((id) => id === stimulus.id).length
    const repetitionPenalty = clamp(timesInCurrentWindow * 0.45)
    const novelty = history.length === 0 ? 0.7 : clamp(1 - familiarity)
    const uncertaintyPenalty = recentHistory.length === 0 ? 0.08 : 0

    const breakdown: StimulusScoreBreakdown = {
      familiarity,
      engagementHistory,
      emotionalSafety,
      caregiverSignal,
      presentStateFit,
      novelty,
      repetitionPenalty,
      uncertaintyPenalty,
    }

    const score = eligible
      ? clamp(
          familiarity * 0.14 +
          engagementHistory * 0.24 +
          emotionalSafety * 0.24 +
          caregiverSignal * 0.12 +
          presentStateFit * 0.16 +
          novelty * 0.10 -
          repetitionPenalty -
          uncertaintyPenalty
        )
      : 0

    if (engagementHistory >= 0.7) reasons.push('Previously supported sustained engagement')
    if (emotionalSafety >= 0.8) reasons.push('History suggests a low-distress topic')
    if (novelty >= 0.65) reasons.push('Provides controlled variety')
    if (repetitionPenalty > 0) reasons.push('Reduced to avoid repeating a recent stimulus')

    return { stimulus, eligible, score, reasons, breakdown }
  }

  select(
    stimuli: PatientStimulus[],
    observations: StimulusObservation[],
    state: ConversationState,
    now = new Date()
  ): SelectionResult {
    const ranked = stimuli
      .map((stimulus) => this.score(stimulus, observations, state, now))
      .sort((left, right) => right.score - left.score || left.stimulus.id.localeCompare(right.stimulus.id))
    const selected = ranked.find((item) => item.eligible && item.score > 0.15) ?? null

    return {
      selected,
      ranked,
      fallbackReason: selected ? undefined : 'No consented, emotionally safe stimulus met the selection threshold',
    }
  }
}
