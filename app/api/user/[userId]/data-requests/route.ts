import { NextRequest, NextResponse } from 'next/server'
import { authErrorResponse, requireRequestIdentity } from '@/lib/auth/server-auth'
import { createAdminServerClient } from '@/lib/supabase/server'
import { clearAuthCookies } from '@/lib/auth/cookies'

const requestTypes = ['export', 'correct', 'restrict', 'delete']

export async function GET(request: NextRequest, { params: routeParams }: { params: Promise<{ userId: string }> }) {
  try {
    const params = await routeParams
    const identity = await requireRequestIdentity(request, params.userId)
    if (identity.mode === 'demo') return NextResponse.json({ requests: [] })
    const { data, error } = await identity.client.from('data_subject_requests').select('*').eq('patient_id', identity.userId).order('requested_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ requests: data ?? [] })
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Failed to load data requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params: routeParams }: { params: Promise<{ userId: string }> }) {
  try {
    const params = await routeParams
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

export async function DELETE(request: NextRequest, { params: routeParams }: { params: Promise<{ userId: string }> }) {
  try {
    const params = await routeParams
    const identity = await requireRequestIdentity(request, params.userId)
    if (identity.mode === 'demo') return NextResponse.json({ error: 'Demo data cannot delete an account' }, { status: 403 })
    if (identity.actorId !== identity.userId) return NextResponse.json({ error: 'Only the account owner can delete this account' }, { status: 403 })
    const body = await request.json()
    if (body.confirmation !== 'DELETE MY MORI ACCOUNT') {
      return NextResponse.json({ error: 'Type the complete confirmation phrase' }, { status: 400 })
    }
    const admin = createAdminServerClient()
    const paths: string[] = []
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await admin.storage.from('memories').list(identity.userId, { limit: 100, offset })
      if (error) throw error
      for (const item of data ?? []) paths.push(`${identity.userId}/${item.name}`)
      if (!data || data.length < 100) break
    }
    if (paths.length) {
      const { error } = await admin.storage.from('memories').remove(paths)
      if (error) throw error
    }
    const { error } = await admin.auth.admin.deleteUser(identity.userId)
    if (error) throw error
    const response = NextResponse.json({ deleted: true, mediaObjectsDeleted: paths.length })
    clearAuthCookies(response)
    return response
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Account deletion could not be completed' }, { status: 500 })
  }
}
