'use client'

import Link from 'next/link'

export default function MinimalHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-secondary/50 transition-all duration-500">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <Link href="/" className="text-primary text-2xl font-semibold italic hover:opacity-80 transition-opacity duration-500">
          Mori
        </Link>
      </nav>
    </header>
  )
}
