'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'

export default function ResetPasswordPage() {
  const started = useRef(false)
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState('Checking your reset link…')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
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
  return <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16"><section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-lg md:p-12"><p className="text-center font-serif text-4xl text-primary">Mori</p><h1 className="mt-8 text-center text-3xl font-semibold">Choose a new password</h1>{message && <p role="status" className="mt-4 text-center leading-relaxed text-text/70">{message}</p>}{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}{ready && <form onSubmit={submit} className="mt-8 space-y-5"><PasswordField label="New password" value={password} visible={showPassword} onChange={setPassword} onToggle={() => setShowPassword(visible => !visible)} /><PasswordField label="Confirm new password" value={confirm} visible={showConfirm} onChange={setConfirm} onToggle={() => setShowConfirm(visible => !visible)} /><button disabled={busy} className="w-full rounded-xl bg-primary px-5 py-4 font-medium text-white disabled:opacity-60">{busy ? 'Updating…' : 'Update password'}</button></form>}{!ready && error && <Link href="/auth/forgot-password" className="mt-6 block text-center text-primary underline">Request another reset link</Link>}</section></main>
}

function PasswordField({ label, value, visible, onChange, onToggle }: { label: string; value: string; visible: boolean; onChange: (value: string) => void; onToggle: () => void }) {
  return <label className="block font-medium">{label}<span className="relative mt-2 block"><input required minLength={12} maxLength={128} type={visible ? 'text' : 'password'} autoComplete="new-password" value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-secondary/60 py-3 pl-4 pr-14" /><button type="button" onClick={onToggle} aria-pressed={visible} aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} title={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-text/55 transition hover:text-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">{visible ? <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.2A10.8 10.8 0 0112 4c5.4 0 9 5.2 9 5.2a14.5 14.5 0 01-2.3 2.8M6.2 6.2C4.2 7.5 3 9.2 3 9.2S6.6 16 12 16c1.2 0 2.3-.3 3.3-.7" strokeLinecap="round" strokeLinejoin="round"/></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="2.5"/></svg>}</button></span></label>
}
