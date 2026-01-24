'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, logout } = useAuth()

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/for-families', label: 'For Families' },
    { href: '/for-caregivers', label: 'For Caregivers' },
    { href: '/research', label: 'Research' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-secondary/50 transition-all duration-500">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-primary text-2xl font-semibold italic hover:opacity-80 transition-opacity duration-500">
            Mori
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-text hover:text-primary transition-colors duration-500 text-lg"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-text hover:text-primary transition-colors duration-500 text-lg"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="bg-primary text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity duration-500"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="bg-primary text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity duration-500"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-text p-2"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden mt-4 transition-all duration-700 ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="flex flex-col space-y-4 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-text hover:text-primary transition-colors duration-500 text-lg"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-text hover:text-primary transition-colors duration-500 text-lg"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout()
                    setIsMenuOpen(false)
                  }}
                  className="bg-primary text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity duration-500 inline-block w-fit"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setIsMenuOpen(false)}
                className="bg-primary text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity duration-500 inline-block w-fit"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
