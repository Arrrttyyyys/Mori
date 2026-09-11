export type PilotConsentStatus = 'not_started' | 'pending' | 'granted' | 'withdrawn'
export type PilotSessionControl = 'active' | 'paused' | 'stopped'
export type PilotIncidentSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface PilotConsent {
  patientConsent: PilotConsentStatus
  representativeConsent: PilotConsentStatus
  patientAssent: PilotConsentStatus
  photosAllowed: boolean
  audioAllowed: boolean
  transcriptAllowed: boolean
  caregiverSharingAllowed: boolean
  researchUseAllowed: boolean
  signedBy?: string
  signedAt?: string
  expiresAt?: string
}

export interface SupervisorAction {
  id: string
  sessionId: string
  userId: string
  action: 'pause' | 'resume' | 'stop' | 'distress' | 'remove_stimulus' | 'acknowledge'
  reason?: string
  createdAt: string
}

export interface PilotIncident {
  id: string
  sessionId: string
  userId: string
  severity: PilotIncidentSeverity
  category: string
  description: string
  status: 'open' | 'acknowledged' | 'resolved'
  createdAt: string
  resolvedAt?: string
}

export interface AuditEvent {
  id: string
  actorId: string
  userId: string
  action: string
  resourceType: string
  resourceId?: string
  metadata: Record<string, string | number | boolean | null>
  createdAt: string
}

export interface PilotReadinessGate {
  id: string
  label: string
  category: 'product' | 'clinical' | 'privacy' | 'operations'
  required: boolean
  complete: boolean
  external: boolean
}
