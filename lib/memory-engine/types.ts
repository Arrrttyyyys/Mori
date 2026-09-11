export type StimulusKind = 'memory' | 'photo' | 'video' | 'person' | 'place' | 'topic'

export interface PatientStimulus {
  id: string
  kind: StimulusKind
  title: string
  personIds?: string[]
  tags?: string[]
  caregiverPriority?: number
  consentStatus: 'allowed' | 'review' | 'blocked'
  sensitive?: boolean
  createdAt: Date
}

export interface StimulusObservation {
  stimulusId: string
  observedAt: Date
  engagement: number
  recognition: number | null
  emotionalValence: number
  confusion: number
  distress: number
  durationSeconds: number
  caregiverAssessment?: 'helpful' | 'neutral' | 'avoid'
}

export interface ConversationState {
  recentStimulusIds: string[]
  sessionStartedAt: Date
  turnCount: number
  engagement: number
  confusion: number
  distress: number
  emotionalValence: number
}

export interface StimulusScoreBreakdown {
  familiarity: number
  engagementHistory: number
  emotionalSafety: number
  caregiverSignal: number
  presentStateFit: number
  novelty: number
  repetitionPenalty: number
  uncertaintyPenalty: number
}

export interface ScoredStimulus {
  stimulus: PatientStimulus
  eligible: boolean
  score: number
  reasons: string[]
  breakdown: StimulusScoreBreakdown
}

export interface SelectionResult {
  selected: ScoredStimulus | null
  ranked: ScoredStimulus[]
  fallbackReason?: string
}

export type MemoryRelationship = 'related_to' | 'person_in' | 'place_of' | 'reminds_of' | 'followed_by'

export interface MemoryGraphEdge {
  sourceId: string
  targetId: string
  relationship: MemoryRelationship
  affinity: number
  recognition: number
  distress: number
  confidence: number
  lastObservedAt: Date
}

export interface MemoryGraph {
  stimuli: PatientStimulus[]
  edges: MemoryGraphEdge[]
}

export interface MemoryBridge {
  stimulus: PatientStimulus
  path: string[]
  relationships: MemoryRelationship[]
  graphScore: number
  stimulusScore: ScoredStimulus
}

export interface LongitudinalMemoryState {
  stimulusId: string
  exposureCount: number
  recognitionStrength: number
  engagementStrength: number
  positiveAffectStrength: number
  confusionRisk: number
  distressRisk: number
  confidence: number
  lastUpdatedAt: Date
}

export interface SafetyDecision {
  action: 'allow' | 'suppress' | 'substitute'
  proposedStimulusId: string
  selectedStimulusId: string | null
  reasons: string[]
}
