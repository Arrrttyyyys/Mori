'use client'

import { useState } from 'react'
import Link from 'next/link'
import TherapyInterface from '@/components/TherapyInterface'
import { useLife } from '@/lib/life/use-life'

export default function MemorySessions() {
  const { userId, life, loading, authorizedFetch, error, setError } = useLife()
  const [starting, setStarting] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const handleStartSession = () => {
    setError('')
    setIsWaiting(true)
  }

  const handleReadyToBegin = async () => {
    if (starting || loading || !userId) return
    setStarting(true)
    setError('')
    try {
      const response = await authorizedFetch(
        `/api/therapy/session?user_id=${encodeURIComponent(userId)}`,
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not start the session. Please try again.')
      setSessionId(data.session.session_id)
      setIsWaiting(false)
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setStarting(false)
    }
  }

  if (sessionId) {
    return (
      <TherapyInterface
        sessionId={sessionId}
        language={life.profile.language}
        audioAllowed={life.profile.audioAllowed}
        onClose={() => {
          setSessionId(null)
          setIsWaiting(false)
        }}
      />
    )
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f4eee5] px-5 py-7 text-text sm:px-8 md:py-10">
      <div aria-hidden="true" className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#d9cabc]/35 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-28 -left-20 h-96 w-96 rounded-full bg-[#b9c9b8]/25 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <header className="mb-7">
          <Link
            href="/room"
            className="inline-flex min-h-11 items-center rounded-full px-3 text-base text-text/60 transition-colors hover:bg-white/60 hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Back to your room
          </Link>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-[.88fr_1.12fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-dark">Memory sessions</p>
            <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.04] text-text md:text-6xl">
              {isWaiting ? 'Take all the time you need.' : `Hello${life.profile.preferredName ? `, ${life.profile.preferredName}` : ''}. Shall we spend a little time together?`}
            </h1>
            <p className="mt-6 max-w-xl text-xl leading-relaxed text-text/70">
              {isWaiting
                ? 'Mori is here whenever you feel ready. Nothing has started yet.'
                : 'There is nowhere you need to get to and nothing you need to remember. We can simply begin with a conversation.'}
            </p>

            {!isWaiting ? (
              <button type="button" onClick={handleStartSession} className="mt-9 inline-flex min-h-16 items-center gap-3 rounded-full bg-primary-dark px-8 py-4 text-xl font-semibold text-white shadow-[0_14px_32px_rgba(67,84,69,.2)] transition hover:-translate-y-0.5 hover:bg-[#4c604f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30">
                Sit with Mori <span aria-hidden="true">→</span>
              </button>
            ) : (
              <div className="mt-9">
                <div className="mb-7 flex items-center gap-5 rounded-3xl bg-white/55 p-5">
                  <div className="breathing-circle shrink-0" aria-hidden="true" />
                  <p className="text-lg leading-relaxed text-text/65">Take a breath or a quiet moment. You decide when the conversation begins.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={handleReadyToBegin} disabled={loading || starting || !userId} className="min-h-16 rounded-full bg-primary-dark px-8 py-4 text-xl font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#4c604f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50">{starting ? 'Getting comfortable…' : 'I’m ready'}</button>
                  <button type="button" disabled={starting} onClick={() => { setIsWaiting(false); setError('') }} className="min-h-16 rounded-full border border-primary/25 bg-white/40 px-7 py-4 text-lg font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-50">Maybe later</button>
                </div>
              </div>
            )}
            {error && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"><p>{error}</p><p className="mt-1 text-sm">Nothing was started. You can try again when ready.</p></div>}
          </div>

          <aside className="order-1 rounded-[2.5rem] border border-white/80 bg-[#fbf8f2]/85 p-4 shadow-[0_26px_70px_rgba(70,61,49,0.13)] backdrop-blur-sm lg:order-2">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#dfe7dc] px-7 pb-7 pt-10 sm:px-10">
              <div aria-hidden="true" className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-[#93a994]/35" />
              <div aria-hidden="true" className="absolute -right-2 top-2 h-28 w-28 rounded-full border border-[#93a994]/30" />
              <div className="relative flex flex-col items-center text-center">
                <div className="rounded-full bg-white/50 p-2 shadow-[0_16px_34px_rgba(54,72,58,.15)] ring-1 ring-white/70">
                  <img src="/images/mori-companion.png" alt="Mori, your AI companion" className="h-40 w-40 rounded-full object-cover sm:h-48 sm:w-48" />
                </div>
                <p className="mt-6 max-w-sm font-serif text-2xl leading-snug text-[#344439]">“We can talk about whatever feels comfortable today.”</p>
                <p className="mt-2 text-sm text-[#4f6253]/70">Mori, your conversation companion</p>
              </div>
            </div>
            <div className="grid gap-3 px-2 py-5 sm:grid-cols-3 sm:px-4">
              {[['○','Talk','There are no wrong answers.'],['Ⅱ','Pause','Quiet moments are welcome.'],['⌂','Finish','Leave whenever you choose.']].map(([icon,title,text]) => <div key={title} className="rounded-2xl px-4 py-3 text-center"><span aria-hidden="true" className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary-dark">{icon}</span><h2 className="mt-3 font-semibold text-text">{title}</h2><p className="mt-1 text-sm leading-relaxed text-text/55">{text}</p></div>)}
            </div>
          </aside>
        </section>
        <p className="mt-8 text-center text-sm leading-relaxed text-text/50">A family member or caregiver may stay nearby if you would like support.</p>
      </div>
    </main>
  )
}
