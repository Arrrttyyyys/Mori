import { NextRequest, NextResponse } from 'next/server'
import { authErrorResponse, requirePatientRole, requireRequestIdentity } from '@/lib/auth/server-auth'
import { createAdminServerClient } from '@/lib/supabase/server'

const decisions = ['approved', 'corrected', 'rejected', 'sensitive', 'delete_requested']
const resourceTypes = ['summary', 'reflection', 'observation', 'memory']

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const identity = await requireRequestIdentity(request)
    await requirePatientRole(identity, params.userId)
    if (identity.mode === 'demo') return NextResponse.json({ reviews: [] })
    const { data, error } = await identity.client.from('caregiver_reviews').select('*').eq('patient_id', params.userId).order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ reviews: data ?? [] })
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const identity = await requireRequestIdentity(request)
    await requirePatientRole(identity, params.userId, ['caregiver', 'supervisor', 'clinician'])
    const body = await request.json()
    if (!resourceTypes.includes(body.resourceType) || !decisions.includes(body.decision)) {
      return NextResponse.json({ error: 'Invalid review resource or decision' }, { status: 400 })
    }
    if (body.decision === 'corrected' && (typeof body.correction !== 'string' || !body.correction.trim())) {
      return NextResponse.json({ error: 'A correction is required' }, { status: 400 })
    }
    if (identity.mode === 'demo') return NextResponse.json({ review: { id: `demo_${Date.now()}`, ...body, patient_id: params.userId, reviewer_id: identity.actorId } }, { status: 201 })
    const admin = createAdminServerClient()
    const { data, error } = await admin.from('caregiver_reviews').insert({ patient_id: params.userId, session_id: body.sessionId || null, reviewer_id: identity.actorId, resource_type: body.resourceType, resource_id: body.resourceId || null, decision: body.decision, correction: typeof body.correction === 'string' ? body.correction.trim().slice(0, 4000) : null }).select('*').single()
    if (error) throw error
    await admin.from('audit_events').insert({ patient_id: params.userId, actor_id: identity.actorId, action: `review.${body.decision}`, resource_type: body.resourceType, resource_id: body.resourceId || null, metadata: {} })
    return NextResponse.json({ review: data }, { status: 201 })
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
  }
}
