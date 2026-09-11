import { NextRequest, NextResponse } from 'next/server'
import { getFamilySpace, setFamilySpace } from '@/lib/user-data-store'
import { latestDecisions } from '@/lib/life/session-engine'
import { loadLifeMemories, demoDetails } from '@/lib/life/store'
import { authErrorResponse, requireRequestIdentity } from '@/lib/auth/server-auth'
import { createAdminServerClient } from '@/lib/supabase/server'

async function loadFamilySpace(identity: Awaited<ReturnType<typeof requireRequestIdentity>>) {
  if (identity.mode === 'demo') return getFamilySpace(identity.userId)
  const [summaries, notes] = await Promise.all([
    identity.client.from('session_summaries').select('id, topic, summary, created_at').eq('owner_id', identity.userId).order('created_at', { ascending: false }),
    identity.client.from('family_notes').select('id, text, created_at').eq('owner_id', identity.userId).order('created_at', { ascending: false }),
  ])
  if (summaries.error) throw summaries.error
  if (notes.error) throw notes.error
  return {
    session_summaries: (summaries.data ?? []).map((row) => ({ id: row.id, date: new Date(row.created_at).toLocaleDateString('en-US'), topic: row.topic, summary: row.summary })),
    reflections: (notes.data ?? []).map((row) => ({ id: row.id, text: row.text })),
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const identity = await requireRequestIdentity(_request, params.userId)
    const family_space = await loadFamilySpace(identity)
    return NextResponse.json({ family_space, adaptive_snapshot: (await latestDecisions(identity))[0] ?? null })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('Get family space error:', error)
    return NextResponse.json({ error: 'Failed to get family space' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const identity = await requireRequestIdentity(request, params.userId)
    const body = await request.json()
    const session_summaries = body.session_summaries ?? []
    const reflections = body.reflections ?? []
    if (identity.mode === 'demo') {
      setFamilySpace(identity.userId, { session_summaries, reflections })
      return NextResponse.json({ family_space: getFamilySpace(identity.userId) })
    }
    const admin = createAdminServerClient()
    const { error: deleteError } = await admin.from('family_notes').delete().eq('owner_id', identity.userId)
    if (deleteError) throw deleteError
    if (reflections.length) {
      const { error } = await admin.from('family_notes').insert(reflections.map((item: { text?: unknown }) => ({ owner_id: identity.userId, author_id: identity.actorId, text: String(item.text ?? '').slice(0, 4000) })).filter((item: { text: string }) => item.text.trim()))
      if (error) throw error
    }
    const family_space = await loadFamilySpace(identity)
    return NextResponse.json({ family_space })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('Set family space error:', error)
    return NextResponse.json({ error: 'Failed to set family space' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const identity = await requireRequestIdentity(request, params.userId)
    const body = await request.json()
    const assessment = body.assessment
    if (!['helpful', 'neutral', 'avoid'].includes(assessment)) {
      return NextResponse.json({ error: 'assessment must be helpful, neutral, or avoid' }, { status: 400 })
    }
    const memoryId=String(body.memoryId??'')
    const memories=await loadLifeMemories(identity)
    const memory=memories.find(m=>String(m.id)===memoryId)
    if(!memory)return NextResponse.json({error:'Select a memory to review'},{status:400})
    // Explicit restrictions live on the memory and persist independently of scores.
    const safety=assessment==='avoid'?'avoid':assessment==='helpful'?'preferred':'neutral'
    if(identity.mode==='demo')demoDetails().set(memoryId,{...memory,safety})
    else {
      const {error}=await identity.client.from('memories').update({safety}).eq('id',memoryId).eq('owner_id',identity.userId);if(error)throw error
      const admin=createAdminServerClient()
      const {error:auditError}=await admin.from('audit_events').insert({patient_id:identity.userId,actor_id:identity.actorId,action:`memory.feedback.${assessment}`,resource_type:'memory',resource_id:memoryId,metadata:{safety}});if(auditError)throw auditError
    }
    return NextResponse.json({ok:true})
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('Caregiver feedback error:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}
