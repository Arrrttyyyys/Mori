'use client'

import { useState, FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ACCOUNT_RELATIONSHIPS, type AccountRelationship } from '@/lib/auth/account-role'
import Link from 'next/link'

export default function Auth() {
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState<AccountRelationship | ''>('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [demoCode, setDemoCode] = useState('')
  const [showDemoCode, setShowDemoCode] = useState(false)
  const [demoSubmitting, setDemoSubmitting] = useState(false)
  const { login, signup, enterDemo } = useAuth()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setNotice('')
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
        if (!relationship) {
          setError('Please choose what brings you to Mori.')
          setSubmitting(false)
          return
        }
        if (!acceptTerms || !acceptPrivacy) {
          setError('Please accept the Terms and Privacy Policy.')
          setSubmitting(false)
          return
        }
        const result = await signup(email, password, name, relationship, acceptTerms, acceptPrivacy)
        if (!result.ok) {
          setError(result.error ?? 'Unable to create account. Please try again.')
        } else if (result.requiresEmailConfirmation) {
          setNotice(`We sent a confirmation link to ${email}. Open that email to continue setting up Mori.`)
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
            {notice && (
              <div role="status" className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-lg leading-relaxed text-text">
                {notice}
              </div>
            )}

            {!isSignIn && (
              <div className="space-y-6">
                <fieldset>
                  <legend className="mb-3 text-lg font-medium text-text">
                    What brings you to Mori?
                  </legend>
                  <div className="space-y-3">
                    {ACCOUNT_RELATIONSHIPS.map((option) => (
                      <label
                        key={option.value}
                        className={`block cursor-pointer rounded-xl border-2 p-4 transition ${relationship === option.value ? 'border-primary bg-primary/5' : 'border-secondary/60'}`}
                      >
                        <span className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="relationship"
                            value={option.value}
                            checked={relationship === option.value}
                            onChange={() => setRelationship(option.value)}
                            className="mt-1 h-5 w-5 accent-primary"
                          />
                          <span>
                            <span className="block font-semibold text-text">{option.title}</span>
                            <span className="mt-1 block text-sm leading-relaxed text-text/65">{option.description}</span>
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
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

            {!isSignIn && (
              <fieldset className="space-y-3 rounded-xl border border-secondary/60 p-4">
                <legend className="px-1 font-medium text-text">Policies</legend>
                <label className="flex items-start gap-3 text-sm leading-relaxed"><input required type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} className="mt-1 h-5 w-5 accent-primary"/><span>I agree to Mori’s <Link className="text-primary underline" href="/terms" target="_blank">Terms and Conditions</Link>.</span></label>
                <label className="flex items-start gap-3 text-sm leading-relaxed"><input required type="checkbox" checked={acceptPrivacy} onChange={(event) => setAcceptPrivacy(event.target.checked)} className="mt-1 h-5 w-5 accent-primary"/><span>I acknowledge Mori’s <Link className="text-primary underline" href="/privacy" target="_blank">Privacy Policy</Link>.</span></label>
              </fieldset>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-text font-medium mb-2 text-lg"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  autoComplete={isSignIn ? 'current-password' : 'new-password'}
                  minLength={isSignIn ? undefined : 12}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-secondary/50 py-3 pl-4 pr-14 text-lg transition-all duration-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="••••••••"
                />
                <PasswordVisibilityButton visible={showPassword} onClick={() => setShowPassword((visible) => !visible)} label="password" />
              </div>
            </div>

            {isSignIn && (
              <div className="flex justify-end">
                <a
                  href="/auth/forgot-password"
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
            <div className="relative">
              <input id="demo-code" type={showDemoCode ? 'text' : 'password'} autoComplete="off" value={demoCode} onChange={(event) => setDemoCode(event.target.value)} className="w-full rounded-xl border border-secondary/50 py-3 pl-4 pr-14 text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Enter the private demo code" />
              <PasswordVisibilityButton visible={showDemoCode} onClick={() => setShowDemoCode((visible) => !visible)} label="demo access code" />
            </div>
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

function PasswordVisibilityButton({ visible, onClick, label }: { visible: boolean; onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} aria-pressed={visible} aria-label={`${visible ? 'Hide' : 'Show'} ${label}`} title={`${visible ? 'Hide' : 'Show'} ${label}`} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-text/55 transition hover:text-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
    {visible ? <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.2A10.8 10.8 0 0112 4c5.4 0 9 5.2 9 5.2a14.5 14.5 0 01-2.3 2.8M6.2 6.2C4.2 7.5 3 9.2 3 9.2S6.6 16 12 16c1.2 0 2.3-.3 3.3-.7" strokeLinecap="round" strokeLinejoin="round"/></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="2.5"/></svg>}
  </button>
}
