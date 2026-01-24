'use client'

import Link from 'next/link'

export default function MemoryLibrary() {
  // Placeholder data for memories
  const memories = [
    {
      id: 1,
      title: 'Summer at the Lake House',
      date: 'December 15, 2024',
      preview: 'I remember the way the light would filter through the trees in the early morning...',
    },
    {
      id: 2,
      title: 'Childhood Holidays',
      date: 'December 10, 2024',
      preview: 'Every year, we would gather around the fireplace and share stories...',
    },
    {
      id: 3,
      title: 'Grandmother\'s Garden',
      date: 'December 5, 2024',
      preview: 'She taught me the names of every flower, and I can still smell the roses...',
    },
  ]

  return (
    <div className="min-h-screen bg-background px-6 py-12 animate-fade-in">
      <div className="max-w-6xl mx-auto">
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
            Back
          </Link>
          <h1 className="text-4xl md:text-5xl font-semibold text-text mb-4">
            Memory Library
          </h1>
          <p className="text-xl text-text/80 leading-relaxed">
            Your stories, preserved with care.
          </p>
        </div>

        {/* Memory Grid */}
        {memories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="bg-secondary/50 rounded-[1.5rem] p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className="text-sm text-text/60 mb-3">{memory.date}</div>
                <h3 className="text-xl font-semibold text-text mb-3">
                  {memory.title}
                </h3>
                <p className="text-lg text-text/70 leading-relaxed line-clamp-3">
                  {memory.preview}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-text/70 leading-relaxed">
              Your library is empty. Start a memory session to begin preserving your stories.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
