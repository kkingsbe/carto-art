import { Github, Shield, Map, Zap } from 'lucide-react';

export function TrustSignals() {
  const signals = [
    {
      icon: Github,
      title: 'Open Source',
      description: 'Code is public on GitHub. Transparent, auditable, community-driven.',
      link: 'https://github.com',
      linkText: 'View on GitHub',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'No tracking pixels, no data selling, minimal analytics. Your work stays yours.',
      link: null,
      linkText: null,
    },
    {
      icon: Map,
      title: 'Powered by OSM',
      description: 'Built on OpenStreetMap, the community-created map of the world.',
      link: 'https://www.openstreetmap.org/about',
      linkText: 'Learn about OSM',
    },
    {
      icon: Zap,
      title: 'Modern Stack',
      description: 'Next.js, MapLibre, TypeScript, Tailwind CSS, Supabase. Fast and reliable.',
      link: null,
      linkText: null,
    },
  ];

  return (
    <section className="py-16 bg-[#f5f0e8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {signals.map((signal) => (
            <div
              key={signal.title}
              className="text-center group"
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#c9a962] to-[#b87333] flex items-center justify-center group-hover:shadow-lg transition-shadow">
                  <signal.icon className="w-6 h-6 text-[#0a0f1a]" />
                </div>
              </div>

              {/* Title */}
              <h3 className="font-bold text-[#0a0f1a] mb-2">
                {signal.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#141d2e]/60 mb-3 leading-relaxed">
                {signal.description}
              </p>

              {/* Link */}
              {signal.link && signal.linkText && (
                <a
                  href={signal.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#c9a962] hover:text-[#b87333] transition-colors font-semibold"
                >
                  {signal.linkText} →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
