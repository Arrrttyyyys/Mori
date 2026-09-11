'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { AuditEvent, PilotConsent, PilotIncident, PilotReadinessGate } from '@/lib/pilot/types'

const defaultConsent: PilotConsent = {
  patientConsent: 'not_started', representativeConsent: 'not_started', patientAssent: 'not_started',
  photosAllowed: false, audioAllowed: false, transcriptAllowed: false, caregiverSharingAllowed: false, researchUseAllowed: false,
}

export default function PilotSafetyCenter() {
  const { userId, authorizedFetch } = useAuth()
  const [consent, setConsent] = useState(defaultConsent)
  const [readiness, setReadiness] = useState<PilotReadinessGate[]>([])
  const [incidents, setIncidents] = useState<PilotIncident[]>([])
  const [audit, setAudit] = useState<AuditEvent[]>([])
  const [saved, setSaved] = useState(false)
  const [error,setError]=useState('')

  const load = async () => {
    if (!userId) return
    const response = await authorizedFetch(`/api/pilot/${encodeURIComponent(userId)}`)
    const data = await response.json()
    if(!response.ok){setError(data.error??'Could not load pilot controls');return}
    setConsent(data.consent); setReadiness(data.readiness); setIncidents(data.incidents); setAudit(data.audit)
  }
  useEffect(() => { load() }, [userId])

  const save = async () => {
    if (!userId) return
    const response = await authorizedFetch(`/api/pilot/${encodeURIComponent(userId)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...consent, actorId: 'demo_supervisor', signedBy: 'Pilot supervisor' }),
    })
    const data = await response.json(); if(!response.ok){setError(data.error??'Could not save consent');return};setConsent(data.consent); setReadiness(data.readiness); setSaved(true); await load()
  }

  const statusSelect = (label: string, key: 'patientConsent' | 'representativeConsent' | 'patientAssent') => (
    <label className="block"><span className="mb-2 block font-medium">{label}</span><select className="w-full rounded-xl border border-primary/20 bg-white p-3" value={consent[key]} onChange={(e) => setConsent({ ...consent, [key]: e.target.value as PilotConsent[typeof key] })}>
      <option value="not_started">Not started</option><option value="pending">Pending</option><option value="granted">Granted</option><option value="withdrawn">Withdrawn</option>
    </select></label>
  )

  return <main className="min-h-screen bg-background px-6 py-12"><div className="mx-auto max-w-5xl">
    <Link href="/room" className="text-text/70 hover:text-primary">← Back to your room</Link>
    <h1 className="mt-5 text-4xl font-semibold">Pilot Safety Center</h1>
    <p className="mt-3 text-lg text-text/70">Operational controls for supervised use. This dashboard does not replace clinical, legal, privacy, or IRB review.</p>

    {error&&<p role="alert" className="mt-5 text-red-700">{error}</p>}
    <section className="mt-10 rounded-3xl bg-white p-7 shadow-lg"><h2 className="text-2xl font-semibold">Consent and ongoing assent</h2><p className="mt-2 text-text/65">The participant's present refusal always stops a session, even when a representative previously consented.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-3">{statusSelect('Patient consent', 'patientConsent')}{statusSelect('Representative consent', 'representativeConsent')}{statusSelect('Patient assent today', 'patientAssent')}</div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">{[
        ['photosAllowed','Photos may be shown'],['audioAllowed','Microphone/audio processing allowed'],['transcriptAllowed','Transcripts may be stored'],['caregiverSharingAllowed','Approved caregivers may view summaries'],['researchUseAllowed','De-identified research use allowed (optional)'],
      ].map(([key,label]) => <label key={key} className="flex items-center gap-3 rounded-xl bg-secondary/20 p-3"><input type="checkbox" checked={Boolean(consent[key as keyof PilotConsent])} onChange={(e) => setConsent({ ...consent, [key]: e.target.checked })}/><span>{label}</span></label>)}</div>
      <button onClick={save} className="mt-6 rounded-xl bg-primary px-6 py-3 font-medium text-white">Save consent record</button>{saved && <span className="ml-4 text-green-700">Saved and audited</span>}
    </section>

    <section className="mt-8 rounded-3xl bg-white p-7 shadow-lg"><h2 className="text-2xl font-semibold">Launch gates</h2><div className="mt-5 space-y-3">{readiness.map(g => <div key={g.id} className="flex items-center justify-between gap-4 rounded-xl bg-secondary/20 p-4"><div><p className="font-medium">{g.label}</p><p className="text-sm text-text/60">{g.category}{g.external ? ' · external approval required' : ''}</p></div><span className={`rounded-full px-3 py-1 text-sm ${g.complete ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>{g.complete ? 'Complete' : 'Open'}</span></div>)}</div></section>

    <div className="mt-8 grid gap-8 md:grid-cols-2"><section className="rounded-3xl bg-white p-7 shadow-lg"><h2 className="text-2xl font-semibold">Safety incidents</h2>{incidents.length ? <ul className="mt-4 space-y-3">{incidents.map(i => <li key={i.id} className="rounded-xl bg-red-50 p-4"><b>{i.category.replaceAll('_',' ')}</b><p>{i.description}</p><small>{i.severity} · {i.status}</small></li>)}</ul> : <p className="mt-4 text-text/60">No incidents recorded.</p>}</section>
    <section className="rounded-3xl bg-white p-7 shadow-lg"><h2 className="text-2xl font-semibold">Recent audit events</h2>{audit.length ? <ul className="mt-4 space-y-3">{audit.slice(0,10).map(e => <li key={e.id} className="border-b pb-3"><b>{e.action}</b><p className="text-sm text-text/60">{new Date(e.createdAt).toLocaleString()}</p></li>)}</ul> : <p className="mt-4 text-text/60">No audit events yet.</p>}</section></div>
  </div></main>
}
