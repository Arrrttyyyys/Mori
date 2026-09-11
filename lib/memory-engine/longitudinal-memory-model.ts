import { LongitudinalMemoryState, StimulusObservation } from './types'

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export class LongitudinalMemoryModel {
  private readonly halfLifeDays = 120

  update(
    previous: LongitudinalMemoryState | null,
    observation: StimulusObservation
  ): LongitudinalMemoryState {
    const prior = previous ?? this.initialState(observation.stimulusId, observation.observedAt)
    const elapsedDays = Math.max(0, observation.observedAt.getTime() - prior.lastUpdatedAt.getTime()) / 86_400_000
    const retention = Math.pow(0.5, elapsedDays / this.halfLifeDays)
    const evidenceWeight = 0.18 + 0.22 * clamp(observation.engagement)
    const update = (oldValue: number, observedValue: number) =>
      clamp(oldValue * retention * (1 - evidenceWeight) + observedValue * evidenceWeight)

    return {
      stimulusId: observation.stimulusId,
      exposureCount: prior.exposureCount + 1,
      recognitionStrength: observation.recognition === null
        ? prior.recognitionStrength * retention
        : update(prior.recognitionStrength, observation.recognition),
      engagementStrength: update(prior.engagementStrength, observation.engagement),
      positiveAffectStrength: update(prior.positiveAffectStrength, (observation.emotionalValence + 1) / 2),
      confusionRisk: update(prior.confusionRisk, observation.confusion),
      distressRisk: update(prior.distressRisk, observation.distress),
      confidence: clamp(prior.confidence * retention + 0.12),
      lastUpdatedAt: observation.observedAt,
    }
  }

  introductionStyle(state: LongitudinalMemoryState): 'open' | 'supported' | 'descriptive' {
    if (state.confidence >= 0.45 && state.recognitionStrength >= 0.72) return 'open'
    if (state.recognitionStrength >= 0.4 && state.confusionRisk < 0.55) return 'supported'
    return 'descriptive'
  }

  private initialState(stimulusId: string, at: Date): LongitudinalMemoryState {
    return {
      stimulusId,
      exposureCount: 0,
      recognitionStrength: 0.5,
      engagementStrength: 0.5,
      positiveAffectStrength: 0.5,
      confusionRisk: 0.25,
      distressRisk: 0.15,
      confidence: 0,
      lastUpdatedAt: at,
    }
  }
}
