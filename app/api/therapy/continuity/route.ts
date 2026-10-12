import { NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, requireRequestIdentity } from '@/lib/auth/server-auth';
import { createAdminServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const identity = await requireRequestIdentity(request);
    if (identity.mode === 'demo') return NextResponse.json({ summaries: [], canReview: false });
    const { data: sessions, error: sessionError } = await identity.client.from('therapy_sessions')
      .select('id').eq('owner_id', identity.userId).eq('status', 'closed').order('started_at', { ascending: false }).limit(20);
    if (sessionError) throw sessionError;
    if (!sessions?.length) return NextResponse.json({ summaries: [], canReview: !identity.workspaceRole || identity.workspaceRole === 'caregiver' });
    const { data, error } = await identity.client.from('session_summaries')
      .select('id,topic,summary,updated_at,created_at,session_id').eq('owner_id', identity.userId)
      .in('session_id', sessions.map(s => s.id)).order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    const summaries = data ?? [];
    const reviewResult = summaries.length ? await createAdminServerClient().from('caregiver_reviews')
      .select('resource_id,decision,correction,created_at').eq('patient_id', identity.userId)
      .eq('resource_type', 'summary').in('resource_id', summaries.map(s => s.id))
      .order('created_at', { ascending: false }).limit(100) : { data: [], error: null };
    if (reviewResult.error) throw reviewResult.error;
    return NextResponse.json({ summaries: summaries.map(s => ({ ...s,
      review: reviewResult.data?.find(r => r.resource_id === s.id && Date.parse(r.created_at) >= Date.parse(s.updated_at)) ?? null,
    })), canReview: !identity.workspaceRole || identity.workspaceRole === 'caregiver' });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Could not load session reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await requireRequestIdentity(request);
    if (identity.mode === 'demo' || (identity.workspaceRole && identity.workspaceRole !== 'caregiver'))
      return NextResponse.json({ error: 'An account owner or caregiver must review session context' }, { status: 403 });
    const body = await request.json();
    if (typeof body.summaryId !== 'string' || !['approved','corrected','rejected'].includes(body.decision))
      return NextResponse.json({ error: 'Choose a valid summary and review decision' }, { status: 400 });
    if (body.decision === 'corrected' && (typeof body.correction !== 'string' || !body.correction.trim() || body.correction.length > 4000))
      return NextResponse.json({ error: 'Enter a correction up to 4,000 characters' }, { status: 400 });
    const { data: summary, error } = await identity.client.from('session_summaries')
      .select('id,session_id,updated_at').eq('owner_id', identity.userId).eq('id', body.summaryId).maybeSingle();
    if (error) throw error;
    if (!summary) return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
    if (body.updatedAt !== summary.updated_at) return NextResponse.json({ error: 'This summary changed. Reload it before reviewing.' }, { status: 409 });
    const { data: session, error: sessionError } = await identity.client.from('therapy_sessions')
      .select('id').eq('owner_id', identity.userId).eq('id', summary.session_id).eq('status', 'closed').maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) return NextResponse.json({ error: 'Finish the session before reviewing its summary' }, { status: 400 });
    const admin = createAdminServerClient();
    const { error: reviewError } = await admin.from('caregiver_reviews').insert({ patient_id: identity.userId,
      session_id: summary.session_id, reviewer_id: identity.actorId, resource_type: 'summary', resource_id: summary.id,
      decision: body.decision, correction: body.decision === 'corrected' ? body.correction.trim() : null });
    if (reviewError) throw reviewError;
    const { error: auditError } = await admin.from('audit_events').insert({ patient_id: identity.userId, actor_id: identity.actorId,
      action: `continuity.${body.decision}`, resource_type: 'summary', resource_id: summary.id, metadata: {} });
    if (auditError) throw auditError;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Could not save session review' }, { status: 500 });
  }
}
