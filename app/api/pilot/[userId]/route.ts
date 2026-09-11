import { NextRequest, NextResponse } from 'next/server'
import { getConsent, listAudit, listIncidents, readinessGates, resetPilotDemo, setConsent } from '@/lib/pilot'
import { authErrorResponse, requirePatientRole, requireRequestIdentity } from '@/lib/auth/server-auth'
import { createAdminServerClient } from '@/lib/supabase/server'
import type { PilotConsent } from '@/lib/pilot/types'

export const dynamic = 'force-dynamic'

function gates(consent: PilotConsent) {
  const consentComplete = consent.patientAssent === 'granted' && (consent.patientConsent === 'granted' || consent.representativeConsent === 'granted')
  return [
    { id: 'consent', label: 'Consent and ongoing assent recorded', category: 'product', required: true, complete: consentComplete, external: false },
    { id: 'media', label: 'Photo, audio and transcript permissions selected', category: 'privacy', required: true, complete: consent.photosAllowed && consent.audioAllowed && consent.transcriptAllowed, external: false },
    { id: 'clinical', label: 'Clinical protocol approved by dementia-care advisor', category: 'clinical', required: true, complete: false, external: true },
    { id: 'privacy', label: 'Privacy, HIPAA/FTC and vendor review complete', category: 'privacy', required: true, complete: false, external: true },
    { id: 'site', label: 'Pilot site, safety lead and escalation contacts confirmed', category: 'operations', required: true, complete: false, external: true },
    { id: 'rehearsal', label: 'Staging rehearsal and safety evaluation passed', category: 'product', required: true, complete: false, external: false },
  ]
}

const emptyConsent: PilotConsent = { patientConsent: 'not_started', representativeConsent: 'not_started', patientAssent: 'not_started', photosAllowed: false, audioAllowed: false, transcriptAllowed: false, caregiverSharingAllowed: false, researchUseAllowed: false }

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const identity = await requireRequestIdentity(request)
    await requirePatientRole(identity, params.userId)
    if (identity.mode === 'demo') return NextResponse.json({ consent: getConsent(params.userId), incidents: listIncidents(params.userId), audit: listAudit(params.userId), readiness: readinessGates(params.userId) })
    const admin = createAdminServerClient()
    const [consentResult, incidentResult, auditResult] = await Promise.all([
      admin.from('pilot_consents').select('*').eq('patient_id', params.userId).maybeSingle(),
      admin.from('pilot_incidents').select('*').eq('patient_id', params.userId).order('created_at', { ascending: false }),
      admin.from('audit_events').select('*').eq('patient_id', params.userId).order('created_at', { ascending: false }).limit(100),
    ])
    if (consentResult.error || incidentResult.error || auditResult.error) throw consentResult.error || incidentResult.error || auditResult.error
    const row = consentResult.data
    const consent: PilotConsent = row ? { patientConsent: row.patient_consent, representativeConsent: row.representative_consent, patientAssent: row.current_assent, photosAllowed: row.photos_allowed, audioAllowed: row.audio_allowed, transcriptAllowed: row.transcript_allowed, caregiverSharingAllowed: row.caregiver_sharing_allowed, researchUseAllowed: row.research_use_allowed, signedBy: row.signed_by, signedAt: row.signed_at, expiresAt: row.expires_at } : emptyConsent
    const incidents = (incidentResult.data ?? []).map((item) => ({ id: item.id, sessionId: item.session_id, userId: item.patient_id, severity: item.severity, category: item.category, description: item.description, status: item.status, createdAt: item.created_at, resolvedAt: item.resolved_at }))
    const audit = (auditResult.data ?? []).map((item) => ({ id: item.id, actorId: item.actor_id ?? 'system', userId: item.patient_id, action: item.action, resourceType: item.resource_type, resourceId: item.resource_id, metadata: item.metadata, createdAt: item.created_at }))
    return NextResponse.json({ consent, incidents, audit, readiness: gates(consent) })
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Failed to load pilot controls' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
  const identity = await requireRequestIdentity(request)
  await requirePatientRole(identity, params.userId, ['supervisor', 'clinician', 'administrator'])
  const body = await request.json()
  const statuses = ['not_started', 'pending', 'granted', 'withdrawn']
  if (![body.patientConsent, body.representativeConsent, body.patientAssent].every((value) => statuses.includes(value))) {
    return NextResponse.json({ error: 'Invalid consent status' }, { status: 400 })
  }
  const nextConsent: PilotConsent = {
    patientConsent: body.patientConsent,
    representativeConsent: body.representativeConsent,
    patientAssent: body.patientAssent,
    photosAllowed: Boolean(body.photosAllowed),
    audioAllowed: Boolean(body.audioAllowed),
    transcriptAllowed: Boolean(body.transcriptAllowed),
    caregiverSharingAllowed: Boolean(body.caregiverSharingAllowed),
    researchUseAllowed: Boolean(body.researchUseAllowed),
    signedBy: typeof body.signedBy === 'string' ? body.signedBy.slice(0, 200) : undefined,
    signedAt: new Date().toISOString(),
  }
  if (identity.mode === 'demo') {
    const consent = setConsent(params.userId, nextConsent, identity.actorId)
    return NextResponse.json({ consent, readiness: readinessGates(params.userId) })
  }
  const admin = createAdminServerClient()
  const { error } = await admin.from('pilot_consents').upsert({ patient_id: params.userId, patient_consent: nextConsent.patientConsent, representative_consent: nextConsent.representativeConsent, current_assent: nextConsent.patientAssent, photos_allowed: nextConsent.photosAllowed, audio_allowed: nextConsent.audioAllowed, transcript_allowed: nextConsent.transcriptAllowed, caregiver_sharing_allowed: nextConsent.caregiverSharingAllowed, research_use_allowed: nextConsent.researchUseAllowed, signed_by: nextConsent.signedBy, signed_at: nextConsent.signedAt, expires_at: nextConsent.expiresAt ?? null }, { onConflict: 'patient_id' })
  if (error) throw error
  await admin.from('audit_events').insert({ patient_id: params.userId, actor_id: identity.actorId, action: 'consent.updated', resource_type: 'pilot_consent', metadata: { patientAssent: nextConsent.patientAssent } })
  return NextResponse.json({ consent: nextConsent, readiness: gates(nextConsent) })
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Failed to save consent' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const identity = await requireRequestIdentity(request)
    if (identity.mode !== 'demo') return NextResponse.json({ error: 'Reset is available only for fictional demo data' }, { status: 403 })
    await requirePatientRole(identity, params.userId)
    resetPilotDemo(params.userId)
    return NextResponse.json({ reset: true })
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Failed to reset demo' }, { status: 500 })
  }
}
