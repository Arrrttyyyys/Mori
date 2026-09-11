import { StoredMemory } from '@/lib/user-data-store'
import { TherapySession } from '@/lib/therapy/types'
import { MemorySafetyController } from './memory-safety-controller'
import { StimulusScoringEngine } from './stimulus-scoring-engine'
import {
  ConversationState,
  PatientStimulus,
  ScoredStimulus,
  StimulusObservation,
} from './types'

export interface AdaptiveSelection {
  memory: StoredMemory | null
  scored: ScoredStimulus | null
  decision: 'allow' | 'substitute' | 'suppress' | 'none'
  explanation: string[]
}

export interface AdaptiveSnapshot {
  selectedMemory: { id: number; title: string; image: string } | null
  engagement: number
  recognition: number | null
  emotionalResponse: number
  confusion: number
  distress: number
  observations: number
  whySelected: string[]
}

const demoGlobal = globalThis as typeof globalThis & {
  __moriAdaptiveDemo?: {
    observationsByUser: Map<string, StimulusObservation[]>
    latestSnapshotBySession: Map<string, AdaptiveSnapshot>
    latestSnapshotByUser: Map<string, AdaptiveSnapshot>
  }
}
const demoState = demoGlobal.__moriAdaptiveDemo ??= {
  observationsByUser: new Map<string, StimulusObservation[]>(),
  latestSnapshotBySession: new Map<string, AdaptiveSnapshot>(),
  latestSnapshotByUser: new Map<string, AdaptiveSnapshot>(),
}
const { observationsByUser, latestSnapshotBySession, latestSnapshotByUser } = demoState

const clamp = (value: number) => Math.min(1, Math.max(0, value))

function toStimulus(memory: StoredMemory): PatientStimulus {
  return {
    id: String(memory.id),
    kind: 'photo',
    title: memory.title,
    tags: memory.tags,
    caregiverPriority: memory.caregiverPriority ?? 0.5,
    consentStatus: memory.consentStatus ?? 'review',
    createdAt: new Date(),
  }
}

function conversationState(session: TherapySession, message = ''): ConversationState {
  const normalized = message.toLowerCase()
  const distressed = /afraid|scared|upset|angry|leave me|don't want|dont want|stop/.test(normalized)
  const confused = /confused|don't know|dont know|not sure|who is|where am/.test(normalized)
  return {
    recentStimulusIds: session.turns.flatMap((turn) => turn.photo_id ? [turn.photo_id] : []),
    sessionStartedAt: session.started_at,
    turnCount: session.turns.length,
    engagement: clamp(message.trim().length / 90),
    confusion: confused ? 0.75 : 0.15,
    distress: distressed ? 0.8 : 0.08,
    emotionalValence: distressed ? -0.7 : /love|happy|wonderful|remember|yes/.test(normalized) ? 0.7 : 0.1,
  }
}

export function selectAdaptiveMemory(
  userId: string,
  memories: StoredMemory[],
  session: TherapySession,
  message: string
): AdaptiveSelection {
  const allowed = memories.filter((memory) => memory.consentStatus !== 'blocked')
  if (!allowed.length) return { memory: null, scored: null, decision: 'none', explanation: ['No approved memories are available'] }

  const engine = new StimulusScoringEngine()
  const observations = observationsByUser.get(userId) ?? []
  const state = conversationState(session, message)
  const selection = engine.select(allowed.map(toStimulus), observations, state)
  if (!selection.selected) {
    return { memory: null, scored: null, decision: 'suppress', explanation: [selection.fallbackReason ?? 'No suitable memory'] }
  }

  const proposed = selection.ranked[0]
  const safety = new MemorySafetyController().evaluate(proposed, selection.ranked, state)
  const selectedId = safety.selectedStimulusId
  const scored = selection.ranked.find((item) => item.stimulus.id === selectedId) ?? null
  const memory = allowed.find((item) => String(item.id) === selectedId) ?? null
  const whySelected = scored?.reasons.length ? scored.reasons : [
    'Approved by the patient profile',
    'Fits the current conversation state',
    'Balances familiarity with gentle variety',
  ]

  const selectionSnapshot: AdaptiveSnapshot = {
    selectedMemory: memory ? { id: memory.id, title: memory.title, image: memory.image } : null,
    engagement: state.engagement,
    recognition: null,
    emotionalResponse: state.emotionalValence,
    confusion: state.confusion,
    distress: state.distress,
    observations: observations.length,
    whySelected,
  }
  latestSnapshotBySession.set(session.session_id, selectionSnapshot)
  latestSnapshotByUser.set(userId, selectionSnapshot)

  return { memory, scored, decision: safety.action, explanation: Array.from(new Set([...whySelected, ...safety.reasons])) }
}

export function observePatientResponse(
  userId: string,
  session: TherapySession,
  message: string
): AdaptiveSnapshot | null {
  const currentPhoto = session.current_photo_id
  if (!currentPhoto) return latestSnapshotBySession.get(session.session_id) ?? null

  const normalized = message.toLowerCase()
  const wordCount = message.trim().split(/\s+/).filter(Boolean).length
  const recognition = /don't remember|dont remember|no idea|not sure/.test(normalized)
    ? 0.2
    : /remember|recognize|that's|that is|yes|my |our |used to|we /.test(normalized) ? 0.82 : null
  const confusion = /confused|don't know|dont know|not sure|who|where/.test(normalized) ? 0.68 : 0.12
  const distress = /afraid|scared|upset|angry|stop|leave me|don't want|dont want/.test(normalized) ? 0.82 : 0.05
  const emotionalValence = /love|happy|wonderful|beautiful|fun|laugh|favorite|favourite/.test(normalized)
    ? 0.8
    : distress > 0.5 ? -0.75 : 0.15
  const engagement = clamp(0.2 + wordCount / 35)
  const observation: StimulusObservation = {
    stimulusId: currentPhoto,
    observedAt: new Date(),
    engagement,
    recognition,
    emotionalValence,
    confusion,
    distress,
    durationSeconds: Math.max(2, Math.min(120, wordCount * 2)),
  }
  const observations = observationsByUser.get(userId) ?? []
  observations.push(observation)
  observationsByUser.set(userId, observations)

  const previous = latestSnapshotBySession.get(session.session_id)
  const snapshot: AdaptiveSnapshot = {
    selectedMemory: previous?.selectedMemory ?? null,
    engagement,
    recognition,
    emotionalResponse: emotionalValence,
    confusion,
    distress,
    observations: observations.length,
    whySelected: previous?.whySelected ?? [],
  }
  latestSnapshotBySession.set(session.session_id, snapshot)
  latestSnapshotByUser.set(userId, snapshot)
  return snapshot
}

export function getLatestUserSnapshot(userId: string): AdaptiveSnapshot | null {
  return latestSnapshotByUser.get(userId) ?? null
}

export function applyCaregiverFeedback(
  userId: string,
  assessment: 'helpful' | 'neutral' | 'avoid'
): AdaptiveSnapshot | null {
  const snapshot = latestSnapshotByUser.get(userId)
  if (!snapshot?.selectedMemory) return snapshot ?? null
  const observations = observationsByUser.get(userId) ?? []
  const latest = [...observations].reverse().find((item) => item.stimulusId === String(snapshot.selectedMemory?.id))
  if (latest) latest.caregiverAssessment = assessment
  const updated = {
    ...snapshot,
    whySelected: [
      ...snapshot.whySelected.filter((reason) => !reason.startsWith('Caregiver feedback:')),
      `Caregiver feedback: ${assessment}`,
    ],
  }
  latestSnapshotByUser.set(userId, updated)
  return updated
}

export function getAdaptiveSnapshot(sessionId: string): AdaptiveSnapshot | null {
  return latestSnapshotBySession.get(sessionId) ?? null
}
