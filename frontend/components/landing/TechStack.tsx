'use client';

export function TechStack() {
  const technologies = [
    'Next.js 16',
    'MapLibre GL',
    'TypeScript',
    'Tailwind CSS',
    'OpenStreetMap',
    'Vercel',
  ];

  return (
    <section className="py-16 bg-[#f5f0e8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-[#141d2e]/50 mb-4 uppercase tracking-wider font-semibold">
            Built with modern technology
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            {technologies.map((tech) => (
              <div
                key={tech}
                className="px-4 py-2 bg-white rounded-lg border border-[#0a0f1a]/10 text-[#141d2e] font-mono text-sm"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
