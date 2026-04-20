'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function FamilySpace() {
  const { userId } = useAuth()
  const [sessionSummaries, setSessionSummaries] = useState<Array<{ id: number; date: string; topic: string; summary: string }>>([])
  const [reflections, setReflections] = useState<Array<{ id: number; text: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    fetch(`/api/user/${encodeURIComponent(userId)}/family-space`)
      .then((res) => res.json())
      .then((data) => {
        if (data.family_space) {
          setSessionSummaries(data.family_space.session_summaries ?? [])
          setReflections(data.family_space.reflections ?? [])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  return (
    <div className="min-h-screen bg-background px-6 py-12 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {loading && <p className="text-text/70 py-4">Loading…</p>}
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
          <h1 className="text-4xl md:text-5xl font-semibold text-text mb-4">
            Family Space
          </h1>
          <p className="text-xl text-text/80 leading-relaxed">
            A place for family to share and connect.
          </p>
        </div>

        {/* Upload Memories */}
        <div className="bg-secondary/50 rounded-[1.5rem] p-8 md:p-10 mb-12 shadow-lg border-2 border-dashed border-primary/30">
          <div className="text-center">
            <div className="text-5xl mb-6">📸</div>
            <h2 className="text-2xl md:text-3xl font-semibold text-text mb-4">
              Share a photo or memory
            </h2>
            <p className="text-lg text-text/70 leading-relaxed mb-6">
              Upload photos, documents, or write a note to spark conversation
            </p>
            <button className="bg-primary text-white px-8 py-4 rounded-2xl text-lg font-medium shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-300">
              Upload
            </button>
          </div>
        </div>

        {/* Session Summaries */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-text mb-4">
            Recent Sessions
          </h2>
          <p className="text-lg text-text/70 leading-relaxed mb-6">
            Brief summaries of recent memory conversations
          </p>

          {sessionSummaries.length > 0 ? (
            <div className="space-y-4">
              {sessionSummaries.map((summary) => (
                <div
                  key={summary.id}
                  className="bg-secondary/50 rounded-[1.5rem] p-6 shadow-lg"
                >
                  <div className="text-lg text-text/60 mb-2">{summary.date}</div>
                  <div className="text-xl font-semibold text-text mb-2">
                    {summary.topic}
                  </div>
                  <p className="text-lg text-text/70 leading-relaxed">
                    {summary.summary}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-lg text-text/70 leading-relaxed">
              No session summaries yet.
            </p>
          )}
        </div>

        {/* Reflections */}
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold text-text mb-4">
            Reflections
          </h2>
          <p className="text-lg text-text/70 leading-relaxed mb-6">
            Gentle observations from Mori
          </p>

          {reflections.length > 0 ? (
            <div className="space-y-4">
              {reflections.map((reflection) => (
                <div
                  key={reflection.id}
                  className="bg-accent/30 rounded-[1.5rem] p-6 shadow-lg"
                >
                  <p className="text-lg text-text/80 leading-relaxed italic">
                    {reflection.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-lg text-text/70 leading-relaxed">
              No reflections yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
