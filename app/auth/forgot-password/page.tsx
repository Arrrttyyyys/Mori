'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    const response = await fetch('/api/auth/password/request', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) })
    const data = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) setError(data.error || 'Could not request a reset link')
    else setMessage(data.message)
  }
  return <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16"><section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-lg md:p-12"><p className="text-center font-serif text-4xl text-primary">Mori</p><h1 className="mt-8 text-center text-3xl font-semibold">Reset your password</h1><p className="mt-3 text-center leading-relaxed text-text/70">Enter your account email. If it matches an account, Mori will send a secure reset link.</p><form onSubmit={submit} className="mt-8 space-y-5"><label className="block font-medium">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-secondary/60 px-4 py-3" /></label>{error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}{message && <p role="status" className="rounded-xl bg-primary/10 p-4">{message}</p>}<button disabled={busy} className="w-full rounded-xl bg-primary px-5 py-4 font-medium text-white disabled:opacity-60">{busy ? 'Sending…' : 'Send reset link'}</button></form><Link href="/auth" className="mt-6 block text-center text-primary underline">Return to sign in</Link></section></main>
}
