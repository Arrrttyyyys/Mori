import { NextRequest, NextResponse } from 'next/server'
import { authErrorResponse, requireRequestIdentity } from '@/lib/auth/server-auth'

const requestTypes = ['export', 'correct', 'restrict', 'delete']

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const identity = await requireRequestIdentity(request, params.userId)
    if (identity.mode === 'demo') return NextResponse.json({ requests: [] })
    const { data, error } = await identity.client.from('data_subject_requests').select('*').eq('patient_id', identity.userId).order('requested_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ requests: data ?? [] })
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Failed to load data requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const identity = await requireRequestIdentity(request, params.userId)
    const body = await request.json()
    if (!requestTypes.includes(body.requestType)) return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
    if (identity.mode === 'demo') return NextResponse.json({ request: { id: `demo_${Date.now()}`, patient_id: identity.userId, request_type: body.requestType, status: 'open', requested_at: new Date().toISOString() } }, { status: 201 })
    const { data, error } = await identity.client.from('data_subject_requests').insert({ patient_id: identity.userId, request_type: body.requestType }).select('*').single()
    if (error) throw error
    return NextResponse.json({ request: data }, { status: 201 })
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Failed to create data request' }, { status: 500 })
  }
}
