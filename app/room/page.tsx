'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function RoomWelcome() {
  const { logout, userName } = useAuth()
  const displayName = userName || 'friend'

  const pathCards = [
    { href: '/room/profile', icon: <span className="text-2xl">01</span>, title: 'Build their Life Map', tagline: 'People, places and meaningful moments', description: 'Set up a profile, connect important people, organize albums and guide future conversations.' },
    { href: '/room/life-map', icon: <span className="text-2xl">02</span>, title: 'Explore the Life Map', tagline: 'A connected life', description: 'Browse memories across time, people and places.' },
    {
      href: '/room/sessions',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: 'Memory Sessions',
      tagline: 'Begin a memory conversation',
      description: 'Spend time revisiting photos, stories, and moments from life through gentle conversation.',
    },
    {
      href: '/room/library',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Memory Library',
      tagline: 'Your photo collection',
      description: 'View and add photos, stories, and life moments that shape each memory journey.',
    },
    {
      href: '/room/family',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Family Space',
      tagline: 'For families & caregivers',
      description: 'Add stories, upload photos, and explore insights from past conversations.',
    },
    {
      href: '/room/pilot',
      icon: <span className="text-4xl" aria-hidden="true">✓</span>,
      title: 'Pilot Safety Center',
      tagline: 'For supervisors & pilot staff',
      description: 'Record consent, review launch gates, incidents, and the pilot audit trail.',
    },
  ]

  return (
    <div className="min-h-screen bg-background px-6 py-12 md:py-20 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Mori Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold italic text-primary mb-8">
            Mori
          </h1>
        </div>

        {/* Greeting Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-semibold text-text mb-3">
            Welcome back, {displayName}.
          </h2>
          <p className="text-xl md:text-2xl text-text leading-relaxed mb-8">
            It's nice to see you again.
          </p>
          <p className="text-xl md:text-2xl text-text/80 leading-relaxed">
            What would you like to do today?
          </p>
        </div>

        {/* Path Cards */}
        <div className="space-y-6 mb-12">
          {pathCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-secondary/50 rounded-[1.5rem] p-8 md:p-10 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group flex items-start gap-6"
            >
              {/* Icon Circle */}
              <div className="flex-shrink-0 w-20 h-20 rounded-full bg-secondary/80 flex items-center justify-center border-2 border-primary/30 group-hover:border-primary-dark transition-colors duration-500">
                <div className="text-primary group-hover:text-primary-dark transition-colors duration-500">
                  {card.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-semibold text-text mb-2 group-hover:text-primary transition-colors duration-500">
                  {card.title}
                </h3>
                <p className="text-lg italic text-primary mb-3">
                  {card.tagline}
                </p>
                <p className="text-lg text-text/80 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Sign Out */}
        <div className="text-center">
          <button
            onClick={logout}
            className="text-text/60 hover:text-text transition-colors duration-500 text-lg"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
