import Image from 'next/image'

export default function ForCaregivers() {
  const benefits = [
    {
      title: 'Support residents with dignity',
      description: 'Mori provides a respectful, dignified way to engage residents in meaningful conversations that honor their life experiences.',
    },
    {
      title: 'Meaningful reminiscence',
      description: 'Use familiar photographs and family stories to invite a comfortable conversation, at the person’s pace.',
    },
    {
      title: 'Easy to use, no training required',
      description: 'Mori is designed to be intuitive. Residents can use it independently, or staff can facilitate conversations with minimal setup.',
    },
    {
      title: 'Brings joy and connection',
      description: 'Watch residents light up as they share stories. Mori creates moments of connection, validation, and joy in care settings.',
    },
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="bg-secondary/20 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-semibold text-text mb-6 leading-tight">
            For Caregivers
          </h1>
          <p className="text-xl md:text-2xl text-text/80 leading-relaxed">
            Supporting residents with dignity through guided reminiscence
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="space-y-12 mb-16">
          <p className="text-xl text-text/80 leading-relaxed">
            As a caregiver, you understand the importance of treating each resident with dignity,
            respect, and compassion. You know that beyond medical care, emotional wellbeing and
            meaningful engagement are essential to quality of life.
          </p>
          <p className="text-xl text-text/80 leading-relaxed">
            Mori supports your work by providing a gentle tool for guided reminiscence—a
            evidence-based approach that helps residents reconnect with their past, share their
            stories, and experience moments of joy and validation.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-500"
            >
              <h3 className="text-2xl font-semibold text-text mb-4">
                {benefit.title}
              </h3>
              <p className="text-lg text-text/70 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Image */}
        <div className="w-full h-96 relative rounded-2xl overflow-hidden mb-16 shadow-lg">
          <Image
            src="/images/FC.png"
            alt="Professional caregiver"
            fill
            className="object-cover"
          />
        </div>

        {/* Closing */}
        <div className="text-center">
          <p className="text-xl md:text-2xl text-text/80 leading-relaxed">
            Mori is designed to complement your care, not complicate it. Simple, respectful, and effective.
          </p>
        </div>
      </section>
    </>
  )
}
