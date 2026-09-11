import { ConversationState, PatientStimulus, SafetyDecision, ScoredStimulus } from './types'

export class MemorySafetyController {
  evaluate(
    proposed: ScoredStimulus,
    rankedAlternatives: ScoredStimulus[],
    state: ConversationState
  ): SafetyDecision {
    const reasons: string[] = [...proposed.reasons]
    const acuteDistress = state.distress >= 0.7
    const acuteConfusion = state.confusion >= 0.75
    const unsafeProposal = !proposed.eligible || proposed.score <= 0.15

    if (acuteDistress) reasons.push('Current distress requires a familiar, low-risk stimulus or present-focused support')
    if (acuteConfusion) reasons.push('Current confusion requires reduced cognitive load')

    if (!unsafeProposal && !acuteDistress && !acuteConfusion) {
      return { action: 'allow', proposedStimulusId: proposed.stimulus.id, selectedStimulusId: proposed.stimulus.id, reasons }
    }

    const substitute = rankedAlternatives.find((candidate) =>
      candidate.stimulus.id !== proposed.stimulus.id &&
      candidate.eligible &&
      candidate.score > 0.25 &&
      candidate.breakdown.emotionalSafety >= 0.75 &&
      (!acuteConfusion || this.hasLowCognitiveLoad(candidate.stimulus))
    )

    if (substitute) {
      return {
        action: 'substitute',
        proposedStimulusId: proposed.stimulus.id,
        selectedStimulusId: substitute.stimulus.id,
        reasons: [...reasons, `Substituted with lower-risk stimulus: ${substitute.stimulus.title}`],
      }
    }

    return {
      action: 'suppress',
      proposedStimulusId: proposed.stimulus.id,
      selectedStimulusId: null,
      reasons: [...reasons, 'No safe substitute is available; use present-focused reassurance'],
    }
  }

  private hasLowCognitiveLoad(stimulus: PatientStimulus): boolean {
    return stimulus.kind === 'photo' || stimulus.kind === 'person' || stimulus.tags?.includes('comforting') === true
  }
}
