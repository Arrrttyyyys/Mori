export default function Research() {
 const questions = [
  ['Personalization', 'Which family-provided memories invite comfortable, meaningful conversation?'],
  ['Safety', 'How reliably do caregiver restrictions and distress-aware redirection support a comfortable experience?'],
  ['Family connection', 'Do session summaries and preserved stories help families prepare for visits?'],
  ['Accessible interaction', 'What pacing, voice, and visual choices work well for different people?'],
 ];
 return <main className="mx-auto max-w-5xl px-6 py-16"><h1 className="text-5xl font-serif">Learning what makes a meaningful moment</h1><p className="mt-6 text-xl text-text/80">Mori is a personalized reminiscence companion. Its purpose is connection and comfortable conversation around someone’s life.</p><p className="mt-5 text-lg text-text/70">Mori has not established clinical efficacy. We do not claim that it diagnoses, treats, or slows dementia. Interaction observations guide personalization and are not cognitive assessments.</p><h2 className="mt-12 text-3xl">Questions we want to explore</h2><div className="mt-6 grid gap-8 md:grid-cols-2">{questions.map(([title,text])=><section key={title} className="border-t border-primary/20 pt-5"><h3 className="text-2xl">{title}</h3><p className="mt-3 text-lg text-text/70">{text}</p></section>)}</div><section className="mt-12 rounded-2xl bg-secondary/30 p-7"><h2 className="text-2xl">Research with care</h2><p className="mt-3 text-lg">Any participant research needs its own consent, study design, appropriate oversight, and review. Research participation remains separate from ordinary family use and is optional.</p></section></main>
}
