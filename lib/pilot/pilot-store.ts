import { AuditEvent, PilotConsent, PilotIncident, PilotReadinessGate, PilotSessionControl, SupervisorAction } from './types'

interface PilotState {
  consent: PilotConsent
  controls: Map<string, PilotSessionControl>
  actions: SupervisorAction[]
  incidents: PilotIncident[]
  audit: AuditEvent[]
}

const shared = globalThis as typeof globalThis & { __moriPilotState?: Map<string, PilotState> }
const states = shared.__moriPilotState ??= new Map<string, PilotState>()

const emptyConsent = (): PilotConsent => ({
  patientConsent: 'not_started', representativeConsent: 'not_started', patientAssent: 'not_started',
  photosAllowed: false, audioAllowed: false, transcriptAllowed: false,
  caregiverSharingAllowed: false, researchUseAllowed: false,
})

function state(userId: string): PilotState {
  let current = states.get(userId)
  if (!current) {
    current = { consent: emptyConsent(), controls: new Map(), actions: [], incidents: [], audit: [] }
    states.set(userId, current)
  }
  return current
}

function id(prefix: string) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }

export function getConsent(userId: string) { return { ...state(userId).consent } }
export function setConsent(userId: string, consent: PilotConsent, actorId: string) {
  state(userId).consent = { ...consent }
  audit(userId, actorId, 'consent.updated', 'pilot_consent', undefined, { patientAssent: consent.patientAssent })
  return getConsent(userId)
}
export function isSessionAllowed(userId: string) {
  const c = state(userId).consent
  return c.patientAssent === 'granted' && (c.patientConsent === 'granted' || c.representativeConsent === 'granted')
}

export function getControl(userId: string, sessionId: string): PilotSessionControl {
  return state(userId).controls.get(sessionId) ?? 'active'
}
export function controlSession(userId: string, sessionId: string, action: SupervisorAction['action'], actorId: string, reason?: string) {
  const s = state(userId)
  const control: PilotSessionControl = action === 'resume' ? 'active' : action === 'stop' ? 'stopped' : 'paused'
  s.controls.set(sessionId, control)
  const item: SupervisorAction = { id: id('action'), sessionId, userId, action, reason, createdAt: new Date().toISOString() }
  s.actions.unshift(item)
  audit(userId, actorId, `session.${action}`, 'therapy_session', sessionId, { reason: reason ?? '' })
  if (action === 'distress') createIncident(userId, sessionId, 'high', 'observed_distress', reason || 'Supervisor observed distress')
  return { control, action: item }
}

export function createIncident(userId: string, sessionId: string, severity: PilotIncident['severity'], category: string, description: string) {
  const item: PilotIncident = { id: id('incident'), sessionId, userId, severity, category, description, status: 'open', createdAt: new Date().toISOString() }
  state(userId).incidents.unshift(item)
  return item
}
export function listIncidents(userId: string) { return [...state(userId).incidents] }

export function audit(userId: string, actorId: string, action: string, resourceType: string, resourceId?: string, metadata: AuditEvent['metadata'] = {}) {
  const item: AuditEvent = { id: id('audit'), actorId, userId, action, resourceType, resourceId, metadata, createdAt: new Date().toISOString() }
  state(userId).audit.unshift(item)
  return item
}
export function listAudit(userId: string) { return [...state(userId).audit].slice(0, 100) }

export function resetPilotDemo(userId: string) { states.delete(userId) }

export function readinessGates(userId: string): PilotReadinessGate[] {
  const c = state(userId).consent
  return [
    { id: 'consent', label: 'Consent and ongoing assent recorded', category: 'product', required: true, complete: isSessionAllowed(userId), external: false },
    { id: 'media', label: 'Photo, audio and transcript permissions selected', category: 'privacy', required: true, complete: c.photosAllowed && c.audioAllowed && c.transcriptAllowed, external: false },
    { id: 'clinical', label: 'Clinical protocol approved by dementia-care advisor', category: 'clinical', required: true, complete: false, external: true },
    { id: 'privacy', label: 'Privacy, HIPAA/FTC and vendor review complete', category: 'privacy', required: true, complete: false, external: true },
    { id: 'site', label: 'Pilot site, safety lead and escalation contacts confirmed', category: 'operations', required: true, complete: false, external: true },
    { id: 'rehearsal', label: 'Staging rehearsal and safety evaluation passed', category: 'product', required: true, complete: false, external: false },
  ]
}
