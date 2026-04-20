'use client'

import { useState, FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function Auth() {
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, signup } = useAuth()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (isSignIn) {
        const result = await login(email, password)
        if (!result.ok) {
          setError(result.error ?? 'Invalid email or password. Please try again.')
        }
      } else {
        if (!name.trim()) {
          setError('Please enter your name.')
          setSubmitting(false)
          return
        }
        const result = await signup(email, password, name)
        if (!result.ok) {
          setError(result.error ?? 'Unable to create account. Please try again.')
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Hero Section */}
      <section className="bg-secondary/20 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-semibold text-text mb-6 leading-tight">
            {isSignIn ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-xl text-text/80 leading-relaxed">
            {isSignIn
              ? 'Continue your journey with Mori'
              : 'Begin preserving your memories today'}
          </p>
        </div>
      </section>

      {/* Auth Form Section */}
      <section className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Tab Toggle */}
          <div className="flex mb-8 bg-secondary/20 rounded-full p-1">
            <button
              onClick={() => setIsSignIn(true)}
              className={`flex-1 py-3 px-4 rounded-full transition-all duration-500 ${
                isSignIn
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text/70 hover:text-text'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignIn(false)}
              className={`flex-1 py-3 px-4 rounded-full transition-all duration-500 ${
                !isSignIn
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text/70 hover:text-text'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-secondary/50 border border-primary/30 text-text px-4 py-3 rounded-xl text-lg">
                {error}
              </div>
            )}

            {!isSignIn && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-text font-medium mb-2 text-lg"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-500 text-lg"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-text font-medium mb-2 text-lg"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-500 text-lg"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-text font-medium mb-2 text-lg"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-500 text-lg"
                placeholder="••••••••"
              />
            </div>

            {isSignIn && (
              <div className="flex justify-end">
                <a
                  href="#"
                  className="text-primary hover:opacity-80 transition-opacity duration-500 text-lg"
                >
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white py-4 rounded-xl hover:opacity-90 transition-opacity duration-500 text-lg font-medium shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? 'Please wait…' : isSignIn ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-secondary/50"></div>
            <span className="px-4 text-text/60 text-lg">or</span>
            <div className="flex-1 border-t border-secondary/50"></div>
          </div>

          {/* Social Login */}
          <div className="space-y-4">
            <button
              type="button"
              className="w-full bg-white border-2 border-secondary/50 text-text py-4 rounded-xl hover:border-primary/50 transition-colors duration-500 text-lg font-medium shadow-md flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              className="w-full bg-white border-2 border-secondary/50 text-text py-4 rounded-xl hover:border-primary/50 transition-colors duration-500 text-lg font-medium shadow-md flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.96-3.24-1.44-1.41-.64-2.44-1.11-3.28-1.92C6.5 16.9 5.95 15.68 6.1 14.3c.06-.5.12-1 .12-1.5 0-.5-.06-1-.12-1.5-.15-1.38.4-2.6 1.35-3.42.84-.81 1.87-1.28 3.28-1.92 1.16-.48 2.15-.94 3.24-1.44 1.03-.48 2.1-.55 3.08.4.78.75 1.5 1.54 2.28 2.33.3.31.3.82 0 1.13-.3.31-.78.31-1.08 0-.78-.8-1.5-1.58-2.28-2.33-.5-.48-1.05-.4-1.58.1-.48.45-.95.9-1.44 1.33-1.16 1.05-1.5 2.1-1.5 3.5 0 1.4.34 2.45 1.5 3.5.49.43.96.88 1.44 1.33.53.5 1.08.58 1.58.1.78-.75 1.5-1.53 2.28-2.33.3-.31.78-.31 1.08 0 .3.31.3.82 0 1.13-.78.79-1.5 1.58-2.28 2.33z" />
              </svg>
              Continue with Apple
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
