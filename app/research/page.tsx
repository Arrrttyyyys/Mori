export default function Research() {
  const researchPoints = [
    {
      title: 'Cognitive Benefits',
      description: 'Studies have shown that reminiscence therapy can improve cognitive function, memory recall, and mental engagement in older adults, particularly those with mild cognitive impairment.',
      citation: 'Woods et al., 2018',
    },
    {
      title: 'Emotional Wellbeing',
      description: 'Research indicates that sharing life stories and engaging in reminiscence can reduce symptoms of depression and anxiety, increase life satisfaction, and improve overall emotional wellbeing.',
      citation: 'Bohlmeijer et al., 2007',
    },
    {
      title: 'Social Connection',
      description: 'Reminiscence therapy facilitates meaningful social interactions, helping older adults feel heard, valued, and connected to others—essential components of healthy aging.',
      citation: 'Cappeliez et al., 2005',
    },
    {
      title: 'Identity and Dignity',
      description: 'Telling one\'s life story helps maintain a sense of identity and continuity, which is crucial for psychological wellbeing, especially during transitions in care or living situations.',
      citation: 'Butler, 1963; Erikson, 1982',
    },
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="bg-secondary/20 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-semibold text-text mb-6 leading-tight">
            The Science Behind Reminiscence
          </h1>
          <p className="text-xl md:text-2xl text-text/80 leading-relaxed">
            Evidence-based benefits of life-story work and memory sharing
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="space-y-12 mb-16">
          <p className="text-xl text-text/80 leading-relaxed">
            Reminiscence therapy is a well-established approach in gerontology and memory care. 
            For decades, researchers have studied how sharing life stories, revisiting memories, 
            and engaging in structured life review can support cognitive health, emotional wellbeing, 
            and quality of life for older adults.
          </p>
          <p className="text-xl text-text/80 leading-relaxed">
            Mori is built on this foundation of research, designed to make the benefits of 
            reminiscence therapy accessible, dignified, and meaningful for individuals and families.
          </p>
        </div>

        {/* Research Points */}
        <div className="space-y-8 mb-16">
          {researchPoints.map((point, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-500"
            >
              <h3 className="text-2xl font-semibold text-text mb-4">
                {point.title}
              </h3>
              <p className="text-lg text-text/70 leading-relaxed mb-4">
                {point.description}
              </p>
              <p className="text-sm text-text/50 italic">
                {point.citation}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Resources */}
        <div className="bg-primary/5 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-semibold text-text mb-6">
            Further Reading
          </h2>
          <ul className="space-y-4 text-lg text-text/70">
            <li>
              • Butler, R. N. (1963). The life review: An interpretation of reminiscence in the aged.
            </li>
            <li>
              • Bohlmeijer, E., et al. (2007). The effects of reminiscence on psychological well-being in older adults.
            </li>
            <li>
              • Woods, B., et al. (2018). Reminiscence therapy for dementia.
            </li>
            <li>
              • Cappeliez, P., et al. (2005). Functions of reminiscence and mental health in later life.
            </li>
          </ul>
        </div>

        {/* Closing */}
        <div className="text-center">
          <p className="text-xl md:text-2xl text-text/80 leading-relaxed italic">
            "Memory is not just the imprint of the past upon us; it is the keeper of what is meaningful for our deepest hopes and fears."
          </p>
          <p className="text-lg text-text/60 mt-4">— Rollo May</p>
        </div>
      </section>
    </>
  )
}
