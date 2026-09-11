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
    <div className="min-h-screen bg-background px-6 py-12 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/room"
            className="inline-flex items-center text-text/70 hover:text-text transition-colors duration-500 mb-4 text-lg"
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
          <h1 className="text-4xl md:text-5xl font-semibold text-text">
            Memory Sessions
          </h1>
        </div>

        {/* Start New Session */}
        <div className="bg-primary/20 rounded-[1.5rem] p-8 md:p-10 mb-12 shadow-lg">
          <h2 className="text-3xl md:text-4xl font-semibold text-text mb-4">
            Begin a new memory
          </h2>
          <p className="text-xl text-text/80 leading-relaxed mb-8">
            Take a moment. When you're ready, Mori will be here to listen.
          </p>

          {!isWaiting ? (
            <button
              onClick={handleStartSession}
              className="bg-primary text-white px-8 py-4 rounded-2xl text-xl font-medium shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-300"
            >
              Start Session
            </button>
          ) : (
            <div className="text-center">
              <div className="mb-6">
                <div className="breathing-circle mx-auto"></div>
              </div>
              <p className="text-2xl md:text-3xl font-semibold text-text mb-4">
                Mori is here...
              </p>
              <p className="text-lg text-text/70 leading-relaxed mb-8">
                Take your time. Begin whenever you're ready.
              </p>
              <button
                onClick={handleReadyToBegin}
                disabled={loading || starting || !userId}
                className="bg-primary text-white px-8 py-4 rounded-2xl text-xl font-medium shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-300"
              >
                {starting ? 'Getting ready…' : 'Ready to begin'}
              </button>
            </div>
          )}
          {error && <p role="alert" className="mt-6 text-lg text-red-700">{error}</p>}
        </div>

      </div>
    </div>
  )
}
