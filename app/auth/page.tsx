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
  const [demoCode, setDemoCode] = useState('')
  const [demoSubmitting, setDemoSubmitting] = useState(false)
  const { login, signup, enterDemo } = useAuth()

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

          {/* Guided demo */}
          <div className="space-y-3">
            <label htmlFor="demo-code" className="block text-sm font-medium text-text/80">Demo access code</label>
            <input id="demo-code" type="password" autoComplete="off" value={demoCode} onChange={(event) => setDemoCode(event.target.value)} className="w-full rounded-xl border border-secondary/50 px-4 py-3 text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Enter the private demo code" />
            <button
              type="button"
              disabled={demoSubmitting}
              onClick={async () => { setError(''); setDemoSubmitting(true); const result = await enterDemo(demoCode); if (!result.ok) setError(result.error || 'Demo access is unavailable.'); setDemoSubmitting(false) }}
              className="w-full bg-secondary/40 border-2 border-primary/30 text-text py-4 rounded-xl hover:border-primary transition-colors duration-500 text-lg font-medium shadow-md"
            >
              {demoSubmitting ? 'Checking access…' : 'Enter the guided demo'}
            </button>
            <p className="text-center text-sm leading-relaxed text-text/60">Uses fictional sample memories and does not create an account.</p>
          </div>
        </div>
      </section>
    </>
  )
}
