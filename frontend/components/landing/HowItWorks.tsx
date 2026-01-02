import { Search, Palette, Download } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      number: '1',
      icon: Search,
      title: 'Search Your Place',
      description: 'Type any location—your hometown, honeymoon destination, or dream vacation spot. Navigate and zoom to get the perfect frame.',
    },
    {
      number: '2',
      icon: Palette,
      title: 'Choose Your Style',
      description: 'Pick from minimal line art, vintage maps, or dramatic terrain styles. Customize colors, typography, and layers in real-time.',
    },
    {
      number: '3',
      icon: Download,
      title: 'Download & Print',
      description: 'Export at poster size (up to 24×36") with no watermarks. Print at home or send to a professional printer. It\'s yours forever.',
    },
  ];

  return (
    <section className="py-24 bg-[#f5f0e8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0a0f1a] mb-4">
            Create Your Poster in
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] to-[#b87333]">
              Three Simple Steps
            </span>
          </h2>
          <p className="text-lg text-[#141d2e]/70 max-w-2xl mx-auto">
            From search to export in under 10 minutes. No experience needed.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
          {/* Connecting lines (desktop only) */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c9a962]/30 to-transparent" style={{ top: '4rem' }} />

          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Step card */}
              <div className="bg-white rounded-lg p-8 shadow-sm border border-[#0a0f1a]/10 hover:shadow-md transition-shadow relative z-10">
                {/* Number badge */}
                <div className="absolute -top-6 left-8 w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a962] to-[#b87333] shadow-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#0a0f1a]">
                    {step.number}
                  </span>
                </div>

                {/* Icon */}
                <div className="mt-8 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-[#f5f0e8] border border-[#c9a962]/20 flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-[#c9a962]" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-[#0a0f1a] mb-3">
                  {step.title}
                </h3>
                <p className="text-[#141d2e]/70 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow indicator (mobile only) */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center my-4">
                  <svg className="w-6 h-6 text-[#c9a962]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Time estimate */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#141d2e]/50 uppercase tracking-wider font-semibold">
            Average creation time: 5-10 minutes
          </p>
        </div>
      </div>
    </section>
  );
}
