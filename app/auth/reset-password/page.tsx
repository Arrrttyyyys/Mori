'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('Checking your reset link…')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const values = new URLSearchParams(window.location.hash.slice(1))
    const body = { accessToken: values.get('access_token'), refreshToken: values.get('refresh_token'), type: values.get('type') }
    const linkError = values.get('error_description')
    window.history.replaceState(null, '', window.location.pathname)
    if (!body.accessToken || !body.refreshToken || body.type !== 'recovery') { setError(linkError?.replace(/\+/g, ' ') || 'This password-reset link is incomplete or has expired.'); setMessage(''); return }
    fetch('/api/auth/password/session', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(async response => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || 'Reset link failed'); setReady(true); setMessage('Choose a new password with at least 12 characters.') }).catch(reason => { setError(reason.message); setMessage('') })
  }, [])
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (password !== confirm) { setError('The passwords do not match.'); return }
    setBusy(true)
    const response = await fetch('/api/auth/password/update', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) })
    const data = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) { setError(data.error || 'Could not update password'); return }
    setReady(false); setMessage('Your password was changed. You can now sign in with the new password.')
    window.setTimeout(() => window.location.replace('/auth'), 1200)
  }
  return <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16"><section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-lg md:p-12"><p className="text-center font-serif text-4xl text-primary">Mori</p><h1 className="mt-8 text-center text-3xl font-semibold">Choose a new password</h1>{message && <p role="status" className="mt-4 text-center leading-relaxed text-text/70">{message}</p>}{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}{ready && <form onSubmit={submit} className="mt-8 space-y-5"><label className="block font-medium">New password<input required minLength={12} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-secondary/60 px-4 py-3" /></label><label className="block font-medium">Confirm new password<input required minLength={12} maxLength={128} type="password" autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} className="mt-2 w-full rounded-xl border border-secondary/60 px-4 py-3" /></label><button disabled={busy} className="w-full rounded-xl bg-primary px-5 py-4 font-medium text-white disabled:opacity-60">{busy ? 'Updating…' : 'Update password'}</button></form>}{!ready && error && <Link href="/auth/forgot-password" className="mt-6 block text-center text-primary underline">Request another reset link</Link>}</section></main>
}
