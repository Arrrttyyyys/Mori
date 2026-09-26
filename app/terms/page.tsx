import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-text">
      <h1 className="text-4xl font-semibold">Terms and Conditions</h1>
      <p className="mt-3 text-text/65">Effective September 25, 2026 · Version 2026-09-25</p>
      <p className="mt-6 text-lg leading-relaxed">These terms govern access to Mori, a memory and guided-reminiscence application. By creating an account, you agree to these terms and acknowledge the Privacy Policy.</p>
      <h2 className="mt-10 text-2xl font-semibold">Who may use Mori</h2>
      <p className="mt-4 leading-relaxed">You must be legally able to enter this agreement and provide accurate account information. If you act for another person, you must have appropriate permission or legal authority. You are responsible for keeping credentials secure and for activity under your account.</p>
      <h2 className="mt-10 text-2xl font-semibold">Permitted use</h2>
      <p className="mt-4 leading-relaxed">Use Mori only for lawful personal, caregiving, professional, demonstration, or approved pilot purposes. Do not upload content without permission, impersonate another person, bypass access controls, probe the service, introduce malicious files, scrape private information, or use Mori to harm, deceive, discriminate against, or exploit another person.</p>
      <h2 className="mt-10 text-2xl font-semibold">Memories and uploaded content</h2>
      <p className="mt-4 leading-relaxed">You retain your rights in submitted content. You grant Mori the limited permission needed to store, process, display, transform, and share that content according to your settings so the service can operate. You confirm that you have the rights and consent needed for submitted content, including images and information about other people.</p>
      <h2 className="mt-10 text-2xl font-semibold">AI and health limitations</h2>
      <p className="mt-4 leading-relaxed">Mori is an AI-assisted reminiscence tool. It is not a doctor, therapist, emergency service, diagnostic system, or substitute for professional judgment. Outputs may be incomplete or wrong. Stop a session if a participant refuses, becomes distressed, or needs human help. Contact local emergency services for urgent danger or medical needs.</p>
      <h2 className="mt-10 text-2xl font-semibold">Availability and changes</h2>
      <p className="mt-4 leading-relaxed">Mori may change, suspend, limit, or discontinue features to protect users, comply with law, maintain security, or improve the service. Preview and demo features may be unavailable and may use fictional data.</p>
      <h2 className="mt-10 text-2xl font-semibold">Suspension and termination</h2>
      <p className="mt-4 leading-relaxed">Access may be limited or suspended for security threats, unlawful conduct, serious misuse, or material violation of these terms. You may stop using Mori and request account deletion through Settings.</p>
      <h2 className="mt-10 text-2xl font-semibold">Disclaimers and liability</h2>
      <p className="mt-4 leading-relaxed">To the extent permitted by law, Mori is provided as available without promises that it will be uninterrupted, error-free, or suitable for clinical decisions. Rights and remedies that cannot legally be excluded remain unaffected. Deployment-specific liability terms and governing law must be approved before commercial or clinical use.</p>
      <h2 className="mt-10 text-2xl font-semibold">Contact and updates</h2>
      <p className="mt-4 leading-relaxed">Updated terms will show a new effective date and material changes may require renewed acceptance. Questions may be directed through the privacy contact in the <Link className="text-primary underline" href="/privacy">Privacy Policy</Link>.</p>
      <p className="mt-10 rounded-xl bg-secondary/30 p-5 leading-relaxed">Qualified counsel must supply the operator’s legal identity, contact address, governing law, liability provisions, and any healthcare or research-specific terms before real participants use Mori.</p>
    </main>
  )
}
