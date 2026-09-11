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
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(132,153,134,0.18),transparent_38%),linear-gradient(145deg,#f8f4ec,#eee7db)] px-5 py-8 text-text sm:px-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 md:mb-12">
          <Link
            href="/room"
            className="mb-5 inline-flex min-h-12 items-center rounded-xl px-2 text-lg text-text/70 transition-colors hover:bg-white/50 hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
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
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">A quiet conversation</p>
          <h1 className="font-serif text-4xl font-semibold text-text md:text-6xl">
            Memory Sessions
          </h1>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_24px_70px_rgba(70,61,49,0.12)] backdrop-blur-sm">
          <div className="grid md:grid-cols-[1fr_0.8fr]">
            <div className="p-7 sm:p-10 md:p-12">
              <h2 className="font-serif text-3xl font-semibold md:text-4xl">
                {isWaiting ? 'Mori is here' : 'Begin a new memory'}
              </h2>
              <p className="mt-4 max-w-xl text-xl leading-relaxed text-text/75">
                {isWaiting
                  ? 'Take a slow breath. Begin whenever you feel comfortable.'
                  : "Take a moment. When you're ready, Mori will listen and gently guide the conversation."}
              </p>

              {!isWaiting ? (
                <button
                  type="button"
                  onClick={handleStartSession}
                  className="mt-8 min-h-16 rounded-2xl bg-primary-dark px-8 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-[#4c604f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                >
                  Start Session
                </button>
              ) : (
                <div className="mt-8">
                  <div className="mb-7 flex items-center gap-5">
                    <div className="breathing-circle shrink-0" aria-hidden="true"></div>
                    <p className="text-lg leading-relaxed text-text/65">
                      Nothing begins until you choose <strong>Ready to begin</strong>.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleReadyToBegin}
                      disabled={loading || starting || !userId}
                      className="min-h-16 rounded-2xl bg-primary-dark px-8 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-[#4c604f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {starting ? 'Getting ready…' : 'Ready to begin'}
                    </button>
                    <button
                      type="button"
                      disabled={starting}
                      onClick={() => {
                        setIsWaiting(false)
                        setError('')
                      }}
                      className="min-h-16 rounded-2xl border border-primary/25 px-7 py-4 text-lg font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-50"
                    >
                      Not now
                    </button>
                  </div>
                </div>
              )}
              {error && (
                <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
                  <p>{error}</p>
                  <p className="mt-1 text-sm">Nothing was started. You can try again when ready.</p>
                </div>
              )}
            </div>

            <aside className="flex flex-col justify-between bg-[#27372e] p-7 text-white sm:p-10 md:p-12">
              <div>
                <img src="/images/mori-companion.png" alt="" className="mb-6 h-24 w-24 rounded-full object-cover ring-4 ring-white/15" />
                <h3 className="font-serif text-2xl text-[#edf3eb]">
                  {life.profile.preferredName
                    ? `A session for ${life.profile.preferredName}`
                    : 'A session at your pace'}
                </h3>
                <ul className="mt-6 space-y-4 text-lg text-white/80">
                  <li className="flex gap-3"><span aria-hidden="true">✓</span><span>No right or wrong answers</span></li>
                  <li className="flex gap-3"><span aria-hidden="true">✓</span><span>Pause or finish at any time</span></li>
                  <li className="flex gap-3"><span aria-hidden="true">✓</span><span>Mori chooses only approved memories</span></li>
                </ul>
              </div>
              <p className="mt-10 text-sm leading-relaxed text-white/70">
                A family member or caregiver can help with setup, then stay nearby if support is needed.
              </p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
