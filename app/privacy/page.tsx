import Link from 'next/link'

const contact = process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-text">
      <h1 className="text-4xl font-semibold">Privacy Policy</h1>
      <p className="mt-3 text-text/65">Effective September 25, 2026 · Version 2026-09-25</p>
      <p className="mt-6 text-lg leading-relaxed">Mori is a memory and guided-reminiscence application. This policy explains what Mori collects, why it is used, how it is shared, and the choices available to account holders and participants.</p>
      <h2 className="mt-10 text-2xl font-semibold">Information Mori handles</h2>
      <p className="mt-4 leading-relaxed">Mori may process account details, relationship and profile settings, memories and written stories, uploaded photos or media, people and place labels, session conversations and summaries, consent choices, caregiver contributions, safety records, and limited technical events such as errors, latency, and usage counts. Operational monitoring is designed not to contain memory text.</p>
      <h2 className="mt-10 text-2xl font-semibold">How information is used</h2>
      <p className="mt-4 leading-relaxed">Information is used to provide authenticated accounts, organize memories, conduct requested sessions, personalize prompts from approved memories, support authorized family collaboration, respond to privacy requests, prevent abuse, investigate incidents, and maintain service reliability. Mori does not sell personal information or use memory content for advertising.</p>
      <h2 className="mt-10 text-2xl font-semibold">AI processing</h2>
      <p className="mt-4 leading-relaxed">When an AI model is enabled, Mori sends only the bounded context needed to produce a response, such as recent conversation turns and approved memory details. Mori does not intentionally send passwords, access tokens, unrelated family notes, or media bytes to the language model. AI responses can be inaccurate and must not be treated as medical advice.</p>
      <h2 className="mt-10 text-2xl font-semibold">Storage and service providers</h2>
      <p className="mt-4 leading-relaxed">Mori uses providers for hosting, authentication, database and private media storage, email delivery, and, when configured, AI inference and file safety scanning. Providers process information to operate the service under their applicable terms. Private media is accessed through time-limited signed links.</p>
      <h2 className="mt-10 text-2xl font-semibold">Sharing</h2>
      <p className="mt-4 leading-relaxed">Information is shared with family members or professionals only through authorized workspace access and consent controls. Sharing can be withdrawn. Mori may disclose information when required by law, to protect a person from a serious safety threat, or to investigate misuse, subject to applicable requirements.</p>
      <h2 className="mt-10 text-2xl font-semibold">Retention and deletion</h2>
      <p className="mt-4 leading-relaxed">Account content is retained while the account is active and according to the retention settings approved for the deployment. Account holders can export or delete information from Settings. Account deletion removes the authentication account, application records, and owned storage objects, subject to lawful preservation duties and verified backup-retention procedures.</p>
      <h2 className="mt-10 text-2xl font-semibold">Your choices and rights</h2>
      <p className="mt-4 leading-relaxed">Depending on location, a person may request access, correction, export, restriction, withdrawal of sharing, or deletion. A participant may pause or stop a session at any time. Research use requires a separate choice and is not required for ordinary use.</p>
      <h2 id="cookies" className="mt-10 scroll-mt-8 text-2xl font-semibold">Cookies and local storage</h2>
      <p className="mt-4 leading-relaxed">Mori uses necessary first-party access and refresh cookies to authenticate requests and maintain a session. They are HttpOnly, SameSite=Lax, restricted to Mori, and Secure over production HTTPS. Signing out or deleting an account clears them. Mori also stores limited interface state on the device, such as acknowledgement of the cookie notice and the selected fictional demo or workspace. Mori currently uses no advertising or cross-site tracking cookies.</p>
      <h2 className="mt-10 text-2xl font-semibold">Security and sensitive information</h2>
      <p className="mt-4 leading-relaxed">Mori uses access controls, private storage, encrypted transport, short-lived media links, upload validation, and monitoring designed to exclude memory text. No service can guarantee absolute security. Do not use Mori for emergencies or as the sole record for medical care.</p>
      <h2 className="mt-10 text-2xl font-semibold">Children</h2>
      <p className="mt-4 leading-relaxed">Mori is not directed to children and accounts must not be created for a child unless a deployment has established an appropriate guardian-consent and legal process.</p>
      <h2 className="mt-10 text-2xl font-semibold">Contact and changes</h2>
      <p className="mt-4 leading-relaxed">Material changes will be reflected by a new effective date and may require renewed acknowledgement. {contact ? <>Privacy questions and requests can be sent to <a className="text-primary underline" href={`mailto:${contact}`}>{contact}</a>.</> : <>Before accepting real participants, Mori will publish a monitored privacy-contact address. Current account holders can use the data controls in Settings.</>}</p>
      <p className="mt-10 rounded-xl bg-secondary/30 p-5 leading-relaxed">A qualified privacy professional must review this notice, retention periods, processors, contact details, and jurisdiction-specific rights before a real-world clinical or research pilot. See also the <Link className="text-primary underline" href="/terms">Terms and Conditions</Link>.</p>
    </main>
  )
}
