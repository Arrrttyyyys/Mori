'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { uploadMemoryPhoto, deleteMemoryPhotoByUrl } from '@/lib/supabase/storage'

interface Memory {
  id: number
  image: string
  title: string
  date: string
}

export default function MemoryLibrary() {
  const { userId } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    fetch(`/api/user/${encodeURIComponent(userId)}/memories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.memories) setMemories(data.memories)
        setLoading(false)
      })
      .catch((e) => {
        setError('Could not load memories')
        setLoading(false)
      })
  }, [userId])

  const handleAddPhoto = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setUploading(true)
    try {
      const result = await uploadMemoryPhoto(userId, file)
      const imageUrl = result?.url
      if (!imageUrl) {
        alert('Photo storage is not configured or upload failed. Add Supabase and create the "memories" bucket – see docs.')
        return
      }
      const title = file.name.replace(/\.[^/.]+$/, '')
      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      const res = await fetch(`/api/user/${encodeURIComponent(userId)}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl, title, date }),
      })
      const data = await res.json()
      if (data.memory) setMemories((prev) => [data.memory, ...prev])
    } catch (err) {
      alert('Failed to add photo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteMemory = async (memory: Memory, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!userId) return
    if (!confirm('Are you sure you want to delete this memory?')) return
    if (memory.image) await deleteMemoryPhotoByUrl(memory.image)
    try {
      const res = await fetch(`/api/user/${encodeURIComponent(userId)}/memories/${memory.id}`, { method: 'DELETE' })
      if (res.ok) setMemories((prev) => prev.filter((m) => m.id !== memory.id))
      else alert('Failed to delete')
    } catch {
      alert('Failed to delete')
    }
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Back Navigation */}
        <Link
          href="/room"
          className="inline-flex items-center text-text/70 hover:text-text transition-colors duration-500 mb-8 text-base"
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

        {/* Header - Centered */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-serif font-normal text-text mb-3">
            Your Memories
          </h1>
          <p className="text-lg text-text/70 font-sans">
            Each photo holds a story.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-12">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
            <button
            onClick={handleAddPhoto}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-3 border border-text/20 rounded-xl bg-white/50 hover:bg-white/70 transition-all duration-300 text-text font-sans text-base cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {uploading ? 'Uploading…' : 'Add a photo'}
          </button>
          <button className="flex items-center gap-2 px-6 py-3 border border-text/20 rounded-xl bg-white/50 hover:bg-white/70 transition-all duration-300 text-text font-sans text-base">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Add a story
          </button>
        </div>

        {loading && (
          <p className="text-center text-text/70 py-8">Loading your memories…</p>
        )}
        {error && (
          <p className="text-center text-red-600 py-4">{error}</p>
        )}
        {!loading && !error && memories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary/30 cursor-pointer hover:opacity-90 transition-opacity duration-300 group"
              >
                {memory.image ? (
                  // Show actual image if available
                  <img
                    src={memory.image}
                    alt={memory.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // Placeholder gradient if no image
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/30 to-accent/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-text/40 text-sm font-sans">
                        {memory.title}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Delete button - appears on hover */}
                <button
                  onClick={(e) => handleDeleteMemory(memory, e)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center shadow-lg z-10"
                  title="Delete memory"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                
                {/* Overlay with title on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-end">
                  <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="font-sans text-sm">{memory.title}</p>
                    <p className="font-sans text-xs text-white/70">{memory.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="text-center py-20">
            <p className="text-xl text-text/70 leading-relaxed font-sans">
              Your library is empty. Add a photo to begin preserving your memories.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
