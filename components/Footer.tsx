import Link from 'next/link'

export default function Footer() {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/for-families', label: 'For Families' },
    { href: '/for-caregivers', label: 'For Caregivers' },
    { href: '/research', label: 'Research' },
    { href: '/privacy', label: 'Privacy and Cookies' },
  ]

  return (
    <footer className="bg-secondary/30 border-t border-secondary/50 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Link href="/" className="text-primary text-2xl font-semibold italic block mb-4">
              Mori
            </Link>
            <p className="text-text/70 text-lg leading-relaxed">
              A gentle place for memories
            </p>
          </div>

          <div>
            <h3 className="text-text font-semibold text-lg mb-4">Navigation</h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text/70 hover:text-primary transition-colors duration-500"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-text font-semibold text-lg mb-4">Connect</h3>
            <Link
              href="/auth"
              className="text-text/70 hover:text-primary transition-colors duration-500 block mb-2"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-secondary/50 text-center text-text/60">
          <p>&copy; {new Date().getFullYear()} Mori. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
