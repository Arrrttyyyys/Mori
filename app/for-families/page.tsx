import Image from 'next/image'

export default function ForFamilies() {
  const features = [
    {
      title: 'Preserve stories before they fade',
      description: 'Capture the memories, wisdom, and experiences of your loved ones while they can still share them. Create a lasting legacy for future generations.',
    },
    {
      title: 'Meaningful conversations across generations',
      description: 'Bridge the gap between generations through storytelling. Help children and grandchildren understand their family history and heritage.',
    },
    {
      title: 'Build a legacy of memories',
      description: 'Create a beautiful, organized archive of family stories that can be passed down, revisited, and cherished for years to come.',
    },
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="bg-secondary/20 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-semibold text-text mb-6 leading-tight">
            For Families
          </h1>
          <p className="text-xl md:text-2xl text-text/80 leading-relaxed">
            Preserve your loved ones' stories and create connections that last
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="space-y-12 mb-16">
          <p className="text-xl text-text/80 leading-relaxed">
            Time moves forward, but memories can fade. As our parents and grandparents age, 
            their stories—the ones that shaped our family, the wisdom they carry, the moments 
            that defined them—become more precious than ever.
          </p>
          <p className="text-xl text-text/80 leading-relaxed">
            Mori helps families capture these stories while they can still be shared. 
            It's a gentle way to start conversations, preserve memories, and create a legacy 
            that your children and grandchildren will treasure.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-500"
            >
              <h3 className="text-2xl font-semibold text-text mb-4">
                {feature.title}
              </h3>
              <p className="text-lg text-text/70 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Image */}
        <div className="w-full h-96 relative rounded-2xl overflow-hidden mb-16 shadow-lg">
          <Image
            src="/images/FF.png"
            alt="Multi-generational family"
            fill
            className="object-cover"
          />
        </div>

        {/* Closing */}
        <div className="text-center">
          <p className="text-xl md:text-2xl text-text/80 leading-relaxed italic">
            "The stories we tell ourselves and others shape who we are and who we become."
          </p>
        </div>
      </section>
    </>
  )
}
