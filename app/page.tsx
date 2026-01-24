import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-secondary/20">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/P1.png"
            alt="Family looking through photo albums"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl md:text-7xl font-semibold text-text mb-6 leading-tight">
            A gentle place for memories
          </h1>
          <p className="text-xl md:text-2xl text-text/80 mb-12 leading-relaxed max-w-2xl mx-auto">
            Preserve life stories, honor cherished moments, and create meaningful connections through the art of reminiscence.
          </p>
        </div>
      </section>

      {/* Intro Section */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-4xl md:text-5xl font-semibold text-text mb-8 text-center">
          What is Mori?
        </h2>
        <div className="prose prose-lg max-w-none text-center">
          <p className="text-xl text-text/80 leading-relaxed mb-6">
            Mori is an AI-powered companion designed for reminiscence therapy, memory care, and life-story conversations. 
            It listens with patience, asks gentle questions, and helps preserve the stories that matter most.
          </p>
          <p className="text-xl text-text/80 leading-relaxed">
            Unlike clinical tools or productivity apps, Mori creates a warm, dignified space where memories can unfold naturally, 
            where stories are honored, and where connection happens at a human pace.
          </p>
        </div>
      </section>

      {/* Why Section */}
      <section className="bg-secondary/20 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-semibold text-text mb-12 text-center">
            Why Mori Exists
          </h2>
          <div className="space-y-8 text-lg text-text/80 leading-relaxed">
            <p>
              Memories are more than neural pathways—they are the threads that weave our identity, connect generations, 
              and give meaning to our lives. When memories fade, when stories go untold, we lose something precious: 
              the wisdom, the laughter, the love that defines who we are.
            </p>
            <p>
              Mori exists because every person deserves to have their story heard, preserved, and honored. 
              We believe in the dignity of memory, the power of storytelling, and the profound impact of being truly listened to.
            </p>
            <p>
              In a world that moves too fast, Mori offers a quiet room—a gentle companion that helps families, 
              caregivers, and older adults create meaningful moments of connection, one story at a time.
            </p>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl md:text-5xl font-semibold text-text mb-16 text-center">
          Who is Mori for?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link
            href="/for-families"
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-500 group"
          >
            <div className="w-full h-64 bg-secondary/30 rounded-xl mb-6 relative overflow-hidden">
              <Image
                src="/images/FF.png"
                alt="For Families"
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-2xl font-semibold text-text mb-4 group-hover:text-primary transition-colors duration-500">
              For Families
            </h3>
            <p className="text-lg text-text/70 leading-relaxed">
              Preserve your loved ones' stories before they fade. Create meaningful conversations across generations and build a legacy of memories.
            </p>
          </Link>

          <Link
            href="/for-caregivers"
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-500 group"
          >
            <div className="w-full h-64 bg-secondary/30 rounded-xl mb-6 relative overflow-hidden">
              <Image
                src="/images/FC.png"
                alt="For Caregivers"
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-2xl font-semibold text-text mb-4 group-hover:text-primary transition-colors duration-500">
              For Caregivers
            </h3>
            <p className="text-lg text-text/70 leading-relaxed">
              Support residents with dignity through reminiscence therapy. Easy to use, no training required, brings joy and connection to care settings.
            </p>
          </Link>

          <Link
            href="/for-families"
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-500 group"
          >
            <div className="w-full h-64 bg-secondary/30 rounded-xl mb-6 relative overflow-hidden">
              <Image
                src="/images/FOA.png"
                alt="For Older Adults"
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-2xl font-semibold text-text mb-4 group-hover:text-primary transition-colors duration-500">
              For Older Adults
            </h3>
            <p className="text-lg text-text/70 leading-relaxed">
              Share your life story in your own time. A gentle companion that listens, remembers, and helps you preserve what matters most.
            </p>
          </Link>
        </div>
      </section>

      {/* Closing Section */}
      <section className="bg-primary/5 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <blockquote className="text-2xl md:text-3xl text-text/80 italic leading-relaxed">
            "Memory is the diary that we all carry about with us."
          </blockquote>
          <p className="text-lg text-text/60 mt-6">— Oscar Wilde</p>
        </div>
      </section>
    </>
  )
}
