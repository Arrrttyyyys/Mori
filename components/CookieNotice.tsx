'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const NOTICE_VERSION = '2026-09-25'

export default function CookieNotice() {
  const [visible, setVisible] = useState(false)
  useEffect(() => setVisible(window.localStorage.getItem('mori_cookie_notice') !== NOTICE_VERSION), [])
  if (!visible) return null
  return (
    <aside aria-label="Cookie notice" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-primary/30 bg-white p-5 shadow-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-relaxed text-text">Mori uses necessary first-party cookies to sign you in and protect your session. It does not use advertising or cross-site tracking cookies. <Link href="/privacy#cookies" className="font-medium text-primary underline">Read the cookie policy</Link>.</p>
        <button type="button" className="shrink-0 rounded-xl bg-primary px-5 py-3 font-medium text-white" onClick={() => { window.localStorage.setItem('mori_cookie_notice', NOTICE_VERSION); setVisible(false) }}>Understood</button>
      </div>
    </aside>
  )
}
