import { NextRequest, NextResponse } from 'next/server'
import { controlSession, getControl } from '@/lib/pilot'
import { authErrorResponse, requirePatientRole, requireRequestIdentity } from '@/lib/auth/server-auth'
import { createAdminServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function actionControl(action?: string) {
  if (action === 'stop') return 'stopped'
  if (action && action !== 'resume' && action !== 'acknowledge') return 'paused'
  return 'active'
}

export async function GET(request: NextRequest, { params: routeParams }: { params: Promise<{ userId: string; sessionId: string }> }) {
  try {
    const params = await routeParams
    const identity = await requireRequestIdentity(request)
    await requirePatientRole(identity, params.userId)
    if (identity.mode === 'demo') return NextResponse.json({ control: getControl(params.userId, params.sessionId) })
    const admin = createAdminServerClient()
    const { data, error } = await admin.from('supervisor_actions').select('action').eq('patient_id', params.userId).eq('session_id', params.sessionId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (error) throw error
    return NextResponse.json({ control: actionControl(data?.action) })
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Failed to load session control' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params: routeParams }: { params: Promise<{ userId: string; sessionId: string }> }) {
  const params = await routeParams
  try {
  const identity = await requireRequestIdentity(request)
  await requirePatientRole(identity, params.userId, ['supervisor', 'clinician', 'administrator'])
  const body = await request.json()
  if (!['pause', 'resume', 'stop', 'distress', 'remove_stimulus', 'acknowledge'].includes(body.action)) {
    return NextResponse.json({ error: 'Invalid supervisor action' }, { status: 400 })
  }
  if (identity.mode === 'demo') return NextResponse.json(controlSession(params.userId, params.sessionId, body.action, identity.actorId, body.reason))
  const admin = createAdminServerClient()
  const { data: session, error: sessionError } = await admin.from('therapy_sessions').select('id').eq('id', params.sessionId).eq('owner_id', params.userId).maybeSingle()
  if (sessionError) throw sessionError
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  const { data: action, error } = await admin.from('supervisor_actions').insert({ patient_id: params.userId, session_id: params.sessionId, actor_id: identity.actorId, action: body.action, reason: typeof body.reason === 'string' ? body.reason.slice(0, 1000) : null }).select('*').single()
  if (error) throw error
  await admin.from('audit_events').insert({ patient_id: params.userId, actor_id: identity.actorId, action: `session.${body.action}`, resource_type: 'therapy_session', resource_id: params.sessionId, metadata: { reason: action.reason ?? '' } })
  if (body.action === 'distress') await admin.from('pilot_incidents').insert({ patient_id: params.userId, session_id: params.sessionId, severity: 'high', category: 'observed_distress', description: action.reason || 'Supervisor observed distress' })
  return NextResponse.json({ control: actionControl(body.action), action: { id: action.id, sessionId: action.session_id, userId: action.patient_id, action: action.action, reason: action.reason, createdAt: action.created_at } })
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Failed to save session control' }, { status: 500 })
  }
}
