'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'

const roles = [
  ['family', 'Family member'],
  ['caregiver', 'Caregiver'],
  ['older_adult', 'Older adult'],
  ['clinician_researcher', 'Clinician or researcher'],
  ['community_partner', 'Community partner'],
  ['other', 'Something else'],
] as const

export default function WaitlistForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setStatus('submitting')
    setMessage('')
    const form = new FormData(formElement)
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          role: form.get('role'),
          interest: form.get('interest'),
          consent: form.get('consent') === 'on',
          website: form.get('website'),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'We could not save your place right now.')
      setStatus('success')
      setMessage('Thank you. You’re on Mori’s waitlist, and we’ll be in touch when there is news to share.')
      formElement.reset()
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'We could not save your place right now.')
    }
  }

  return (
    <form onSubmit={submit} className="mt-10 rounded-3xl border border-primary/15 bg-white p-6 text-left shadow-lg md:p-9">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-base font-medium">Name</span>
          <input name="name" autoComplete="name" maxLength={120} className="w-full rounded-xl border border-primary/20 bg-background px-4 py-3 text-lg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
        </label>
        <label className="block">
          <span className="mb-2 block text-base font-medium">Email address</span>
          <input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} className="w-full rounded-xl border border-primary/20 bg-background px-4 py-3 text-lg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
        </label>
      </div>

      <label className="mt-6 block">
        <span className="mb-2 block text-base font-medium">What brings you to Mori?</span>
        <select name="role" required defaultValue="" className="w-full rounded-xl border border-primary/20 bg-background px-4 py-3 text-lg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15">
          <option value="" disabled>Choose one</option>
          {roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>

      <label className="mt-6 block">
        <span className="mb-2 block text-base font-medium">What would you like to hear about? <span className="font-normal text-text/55">(optional)</span></span>
        <textarea name="interest" maxLength={1000} rows={4} placeholder="For example, family access, caregiver support, or future pilot opportunities" className="w-full resize-y rounded-xl border border-primary/20 bg-background px-4 py-3 text-lg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
      </label>

      <label className="sr-only" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-text/70">
        <input name="consent" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-primary" />
        <span>I agree that Mori may email me about availability and product updates. I understand I can unsubscribe at any time and acknowledge the <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.</span>
      </label>

      <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <button type="submit" disabled={status === 'submitting'} className="rounded-full bg-primary px-7 py-3 text-lg font-medium text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60">
          {status === 'submitting' ? 'Joining…' : 'Join the waitlist'}
        </button>
        <p aria-live="polite" className={status === 'error' ? 'text-sm text-red-700' : 'text-sm text-primary'}>{message}</p>
      </div>
    </form>
  )
}
