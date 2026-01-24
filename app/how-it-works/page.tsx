export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Begin with a memory',
      description: 'Start a conversation by sharing a memory—whether through voice or text. It could be a moment from childhood, a favorite place, or a person who mattered.',
    },
    {
      number: '2',
      title: 'Mori listens and asks gentle questions',
      description: 'Mori listens with patience and asks thoughtful follow-up questions that help you explore deeper. No pressure, no rush—just a gentle companion guiding the conversation.',
    },
    {
      number: '3',
      title: 'Stories are preserved and organized',
      description: 'As you share, Mori quietly organizes your stories, creating a beautiful timeline of your life. Everything is saved securely and can be revisited anytime.',
    },
    {
      number: '4',
      title: 'Share with family or keep private',
      description: 'Choose to share your stories with loved ones, creating connections across generations, or keep them private as your personal memory archive.',
    },
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="bg-secondary/20 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-semibold text-text mb-6 leading-tight">
            How Mori Works
          </h1>
          <p className="text-xl md:text-2xl text-text/80 leading-relaxed">
            A gentle, natural conversation that honors your stories
          </p>
        </div>
      </section>

      {/* Process Section */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="space-y-16">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row gap-8 items-start group"
            >
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-semibold shadow-lg group-hover:scale-110 transition-transform duration-500">
                  {step.number}
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h2 className="text-3xl md:text-4xl font-semibold text-text mb-4">
                  {step.title}
                </h2>
                <p className="text-xl text-text/80 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing Section */}
      <section className="bg-secondary/20 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xl md:text-2xl text-text/80 leading-relaxed">
            Mori is designed to feel like talking to a trusted friend—someone who listens, 
            remembers, and helps you explore the stories that shape who you are.
          </p>
        </div>
      </section>
    </>
  )
}
