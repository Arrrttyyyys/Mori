'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isRoom = pathname?.startsWith('/room')
  const isDashboard = pathname === '/dashboard'

  return (
    <>
      {!isRoom && !isDashboard && <Header />}
      <div className="min-h-screen">{children}</div>
      {!isRoom && !isDashboard && <Footer />}
    </>
  )
}
