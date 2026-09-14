export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-text">
      <h1 className="text-4xl font-semibold">Privacy and cookies</h1>
      <p className="mt-6 text-lg leading-relaxed">
        Mori uses first-party authentication cookies to keep an account signed in securely. These cookies are necessary for account access and are not used for advertising or cross-site tracking.
      </p>
      <h2 className="mt-10 text-2xl font-semibold">Authentication cookies</h2>
      <p className="mt-4 text-lg leading-relaxed">
        An access cookie verifies signed-in requests, and a refresh cookie maintains the session for up to 30 days. Both are protected from browser scripts, restricted to Mori, and sent only over HTTPS in production. Signing out or deleting the account clears them.
      </p>
      <h2 className="mt-10 text-2xl font-semibold">Information kept out of cookies</h2>
      <p className="mt-4 text-lg leading-relaxed">
        Mori does not place memory text, transcripts, photos, medical information, names, or family relationships in authentication cookies. Account and memory information remains subject to authenticated access controls.
      </p>
      <h2 className="mt-10 text-2xl font-semibold">Shared devices</h2>
      <p className="mt-4 text-lg leading-relaxed">
        Sign out after using Mori on a shared device. A pilot supervisor should also close the browser and follow the pilot site’s device-handling procedure.
      </p>
      <p className="mt-10 rounded-xl bg-secondary/30 p-5 leading-relaxed">
        This page describes the current technical cookie behavior. The complete participant privacy notice, request contact, retention periods, and jurisdiction-specific terms must be approved before a real-world pilot.
      </p>
    </main>
  )
}
