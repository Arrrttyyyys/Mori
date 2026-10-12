'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buttonClass, fieldClass } from '@/components/LifeShell';

type Summary = { id: string; topic: string; summary: string; updated_at: string; review: {decision:string;correction:string|null} | null };
export default function SessionContinuityReview() {
  const { authorizedFetch, userId } = useAuth();
  const [summaries,setSummaries] = useState<Summary[]>([]);
  const [canReview,setCanReview] = useState(false);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [corrections,setCorrections] = useState<Record<string,string>>({});
  async function load() {
    const response = await authorizedFetch('/api/therapy/continuity');
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'Could not load summaries');
    setSummaries(data.summaries);setCanReview(data.canReview);
  }
  useEffect(()=>{setSummaries([]);setCorrections({});setError('');load().catch(e=>setError(e.message));},[userId]);
  async function review(summary: Summary, decision: string) {
    setBusy(true);setError('');
    try {
      const response = await authorizedFetch('/api/therapy/continuity',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({summaryId:summary.id,updatedAt:summary.updated_at,decision,correction:corrections[summary.id]})});
      const data = await response.json();if(!response.ok)throw Error(data.error || 'Could not save review');
      await load();
    } catch(e) {setError(e instanceof Error ? e.message : 'Could not save review');}
    finally {setBusy(false);}
  }
  return <section className="mt-8 rounded-2xl bg-secondary/30 p-6">
    <h2 className="text-2xl">Context for future conversations</h2>
    <p className="mt-3 text-text/70">Review a session summary before Mori uses it to gently suggest topics. Up to three recent approved summaries may be used. Approval does not make a conversation statement a confirmed life fact.</p>
    {error && <p role="alert" className="mt-3 text-red-800">{error}</p>}
    {!summaries.length && !error && <p className="mt-4">Summaries appear here after signed-in sessions finish.</p>}
    {summaries.map(summary=><details key={summary.id} className="mt-4 border-t border-primary/20 pt-4">
      <summary className="cursor-pointer text-lg">{summary.topic} · {['approved','corrected'].includes(summary.review?.decision ?? '') ? 'Available for future conversations' : 'Withheld from future conversations'}</summary>
      <p className="mt-3 whitespace-pre-wrap">{summary.review?.decision==='corrected' ? summary.review.correction : summary.summary}</p>
      {canReview && <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <button disabled={busy} className={buttonClass} onClick={()=>review(summary,'approved')}>Approve original summary</button>
          <button disabled={busy} className="min-h-12 rounded-xl border border-primary/40 px-4" onClick={()=>review(summary,'rejected')}>Withhold summary</button>
        </div>
        <label className="block" htmlFor={`correction-${summary.id}`}>Or write a corrected summary</label>
        <textarea id={`correction-${summary.id}`} className={fieldClass} maxLength={4000} value={corrections[summary.id] ?? ''} onChange={e=>setCorrections({...corrections,[summary.id]:e.target.value})} />
        <button disabled={busy || !corrections[summary.id]?.trim()} className={buttonClass} onClick={()=>review(summary,'corrected')}>Save correction for future conversations</button>
      </div>}
    </details>)}
  </section>;
}
