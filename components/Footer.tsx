import Link from 'next/link'

export default function Footer() {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/for-families', label: 'For Families' },
    { href: '/for-caregivers', label: 'For Caregivers' },
    { href: '/research', label: 'Research' },
    { href: '/#waitlist', label: 'Join the Waitlist' },
    { href: '/privacy', label: 'Privacy and Cookies' },
    { href: '/terms', label: 'Terms and Conditions' },
  ]

  return (
    <footer className="bg-[#303b34] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Link href="/" className="mb-4 block text-3xl font-semibold italic text-[#e8ddcd]">
              Mori
            </Link>
            <p className="max-w-sm text-lg leading-relaxed text-white/60">
              A gentle place for memories, stories, and the people who hold them.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[.18em] text-[#b9c7b8]">Explore</h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 transition-colors duration-500 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[.18em] text-[#b9c7b8]">Your Mori</h3>
            <Link
              href="/auth"
              className="mb-4 block text-white/60 transition-colors duration-500 hover:text-white"
            >
              Sign In
            </Link><Link href="/#waitlist" className="inline-flex rounded-full border border-white/20 px-5 py-2.5 text-white/80 transition hover:bg-white/10">Join the waitlist</Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-8 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Mori. All rights reserved.</p><p>Built for connection, with care.</p>
        </div>
      </div>
    </footer>
  )
}
