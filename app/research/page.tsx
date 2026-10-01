import Image from 'next/image'
import Link from 'next/link'

const evidence = [
  {
    tag: 'Evidence review',
    year: '2018',
    title: 'Reminiscence therapy for dementia',
    source: 'Cochrane Database of Systematic Reviews',
    finding: 'The review found that effects vary by setting and format. Some studies reported small benefits in communication, quality of life, cognition, or mood, while the overall evidence remained inconsistent.',
    relevance: 'Mori treats reminiscence as a way to invite conversation—not as a proven treatment or guaranteed outcome.',
    href: 'https://pubmed.ncbi.nlm.nih.gov/29493789/',
  },
  {
    tag: 'Pilot randomized trial',
    year: '2020',
    title: 'Digital reminiscence with personal photographs',
    source: 'BMC Geriatrics',
    finding: 'In a 49-person pilot, digital reminiscence was associated with greater engagement and lower depression scores than storytelling without digital materials. Cognition and behavioral symptoms did not differ significantly.',
    relevance: 'Personal media may help start an engaging interaction, but a small pilot cannot support broad clinical claims.',
    href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7204054/',
  },
  {
    tag: 'Technology-supported conversation',
    year: '2018',
    title: 'Computer Interactive Reminiscence and Conversation Aid',
    source: 'Journal of Medical Internet Research',
    finding: 'A study involving 161 people with dementia examined a multimedia conversation aid using photographs, music, and video. The design emphasized independent choice and participation in conversation.',
    relevance: 'Technology should provide material for a shared conversation while preserving the person’s agency.',
    href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6153376/',
  },
  {
    tag: 'Conversational-agent study',
    year: '2021',
    title: 'Usability and acceptance of the virtual agent Anne',
    source: 'JMIR mHealth and uHealth',
    finding: 'A four-week home study included 20 people living with dementia and 14 caregivers. Engagement was encouraging, but speech recognition and voice synthesis problems reduced usefulness and trust.',
    relevance: 'Voice failures are part of safety and usability testing, not merely technical inconveniences.',
    href: 'https://pubmed.ncbi.nlm.nih.gov/34170256/',
  },
  {
    tag: 'Ethics and consent',
    year: '2018',
    title: 'Consent recommendations for dementia research and data sharing',
    source: "Alzheimer's & Dementia",
    finding: 'The authors recommend supported decision-making, presuming capacity unless shown otherwise, involving the person even when a representative participates, and respecting objections to continued participation.',
    relevance: 'Research consent, present-moment assent, and the ability to stop should remain active throughout a Mori study.',
    href: 'https://doi.org/10.1016/j.jalz.2018.05.011',
  },
  {
    tag: 'Person-centered care review',
    year: '2024',
    title: 'Person-centered care in residential aged care',
    source: 'The Gerontologist',
    finding: 'A review of 41 studies found conflicting effectiveness across measured outcomes and identified practical barriers such as time constraints and enablers such as staff collaboration.',
    relevance: 'A pilot should test fit within real care routines as well as the experience of the person using Mori.',
    href: 'https://academic.oup.com/gerontologist/article/64/5/gnad052/7152914',
  },
]

const questions = [
  ['Comfort and agency', 'Does the person remain comfortable, able to redirect the conversation, and willing to continue?'],
  ['Conversation quality', 'Do familiar prompts support participation without turning recall into a test?'],
  ['Technical reliability', 'How often do speech recognition, response timing, or model errors interrupt trust?'],
  ['Family and care fit', 'Does Mori support connection without adding unreasonable setup or supervision work?'],
]

export default function Research() {
  return <main>
    <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
      <div><p className="text-sm font-semibold uppercase tracking-[.22em] text-primary-dark">Research behind the questions</p><h1 className="mt-5 text-5xl leading-[1.04] tracking-[-.03em] md:text-7xl">Built from evidence. Honest about what is still unknown.</h1><p className="mt-7 max-w-2xl text-xl leading-relaxed text-text/70">Mori draws on research into reminiscence, person-centered care, digital conversation aids, and supported decision-making. That research informs the design; it does not prove Mori’s effectiveness.</p></div>
      <div className="relative h-[520px]"><div className="absolute inset-4 overflow-hidden rounded-[48%_48%_2rem_2rem] bg-white p-3 shadow-[0_24px_60px_rgba(61,53,40,.16)]"><div className="relative h-full overflow-hidden rounded-[48%_48%_1.4rem_1.4rem]"><Image src="/images/editorial/calm-portrait.webp" alt="Portrait of an older woman at home" fill priority sizes="(max-width: 1024px) 90vw, 520px" className="object-cover" /></div></div><div className="absolute bottom-0 left-0 rounded-2xl bg-[#303b34] px-6 py-4 text-white shadow-xl"><p className="text-sm uppercase tracking-[.16em] text-white/55">The starting point</p><p className="mt-1 text-xl">Listen to the person.</p></div></div>
    </section>

    <section className="border-y border-primary/10 bg-[#e8ded1] py-24">
      <div className="mx-auto max-w-7xl px-6"><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[.2em] text-primary-dark">Selected research</p><h2 className="mt-4 text-4xl leading-tight md:text-5xl">What the literature suggests—and where it asks for caution.</h2><p className="mt-5 text-lg leading-relaxed text-text/65">These studies are relevant to Mori’s design questions. They are not endorsements of Mori, and their findings should not be generalized beyond their methods and participants.</p></div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">{evidence.map((study, index) => <article key={study.title} className={`flex flex-col rounded-[2rem] p-7 md:p-8 ${index === 0 ? 'bg-[#303b34] text-white' : 'border border-text/10 bg-white/80'}`}><div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[.15em]"><span className={index === 0 ? 'text-[#b9c7b8]' : 'text-primary-dark'}>{study.tag}</span><span className={index === 0 ? 'text-white/45' : 'text-text/40'}>{study.year}</span></div><h3 className="mt-6 text-2xl leading-snug">{study.title}</h3><p className={`mt-2 text-sm ${index === 0 ? 'text-white/50' : 'text-text/45'}`}>{study.source}</p><p className={`mt-5 leading-relaxed ${index === 0 ? 'text-white/72' : 'text-text/68'}`}>{study.finding}</p><div className={`mt-6 rounded-2xl p-4 ${index === 0 ? 'bg-white/[.07]' : 'bg-secondary/45'}`}><p className={`text-xs font-semibold uppercase tracking-[.14em] ${index === 0 ? 'text-[#b9c7b8]' : 'text-primary-dark'}`}>How it informs Mori</p><p className={`mt-2 text-sm leading-relaxed ${index === 0 ? 'text-white/70' : 'text-text/65'}`}>{study.relevance}</p></div><a href={study.href} target="_blank" rel="noreferrer" className={`mt-6 inline-flex items-center gap-2 self-start border-b pb-1 font-semibold ${index === 0 ? 'border-white/30 text-white/85' : 'border-primary/35 text-primary-dark'}`}>Read the original research <span aria-hidden="true">↗</span></a></article>)}</div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-6 py-24"><div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-primary-dark">What Mori should test</p><h2 className="mt-4 text-4xl leading-tight">Measure the experience without reducing a person to a score.</h2><p className="mt-5 text-lg leading-relaxed text-text/65">Early evaluation should emphasize feasibility, comfort, failures, and lived experience before asking whether larger outcome studies are justified.</p></div><div className="grid gap-5 sm:grid-cols-2">{questions.map(([title,text],i)=><article key={title} className="rounded-3xl border border-text/10 bg-white p-7"><span className="text-sm text-primary-dark">0{i+1}</span><h3 className="mt-7 text-2xl">{title}</h3><p className="mt-4 leading-relaxed text-text/65">{text}</p></article>)}</div></div></section>

    <section className="bg-[#303b34] py-24 text-white"><div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1.25fr_.75fr]"><article className="rounded-[2rem] border border-white/10 bg-white/[.055] p-8 md:p-10"><p className="text-sm uppercase tracking-[.2em] text-[#b9c7b8]">Current evidence boundary</p><h2 className="mt-5 max-w-3xl text-4xl leading-tight">Mori has not established clinical efficacy.</h2><p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/70">Mori does not diagnose, assess cognition, treat, prevent, or slow dementia. Evidence about reminiscence or other technologies cannot be transferred directly to Mori. Any claims about Mori require appropriately designed evaluation of Mori itself.</p></article><article className="rounded-[2rem] bg-[#e8ddcd] p-8 text-[#303b34]"><p className="text-sm uppercase tracking-[.2em] text-primary-dark">Research with care</p><h2 className="mt-5 text-3xl">Consent is a process.</h2><p className="mt-5 leading-relaxed text-text/70">A study needs independent review, clear consent, present-moment assent, accessible explanations, stopping rules, and respect for any sign that a person does not want to continue.</p></article></div></section>

    <section className="mx-auto max-w-4xl px-6 py-20 text-center"><p className="text-lg text-text/65">Interested in reviewing Mori or advising a carefully supervised pilot?</p><Link href="/#waitlist" className="mt-5 inline-flex rounded-full bg-primary-dark px-7 py-3.5 text-lg text-white">Join the waitlist</Link><p className="mt-6 text-sm leading-relaxed text-text/45">Research links were reviewed October 1, 2026. Mori is not affiliated with the authors or publishers listed above.</p></section>
  </main>
}
