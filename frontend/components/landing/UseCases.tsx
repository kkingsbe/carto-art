import { Card } from '@/components/ui/card';
import { useCases } from '@/lib/data/styleShowcase';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function UseCases() {
  return (
    <section className="py-24 bg-[#0a0f1a] relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 35px, #f5f0e8 35px, #f5f0e8 36px),
                           repeating-linear-gradient(90deg, transparent, transparent 35px, #f5f0e8 35px, #f5f0e8 36px)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#f5f0e8] mb-4">
            Perfect For
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] to-[#b87333]">
              Every Occasion
            </span>
          </h2>
          <p className="text-lg text-[#d4cfc4] max-w-2xl mx-auto">
            From personal keepsakes to professional marketing, map posters tell your story
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase) => (
            <Card
              key={useCase.id}
              className="bg-[#141d2e]/50 backdrop-blur-sm border-[#d4cfc4]/10 hover:border-[#c9a962]/30 transition-all duration-300 p-6 group hover:transform hover:scale-105"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#c9a962] to-[#b87333] flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow">
                <useCase.icon className="w-7 h-7 text-[#0a0f1a]" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-[#f5f0e8] mb-3 group-hover:text-[#c9a962] transition-colors">
                {useCase.title}
              </h3>

              {/* Description */}
              <p className="text-[#d4cfc4] text-sm leading-relaxed mb-4">
                {useCase.description}
              </p>

              {/* Target audience (subtle) */}
              <p className="text-[#d4cfc4]/50 text-xs italic">
                {useCase.targetAudience}
              </p>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-[#c9a962] hover:text-[#b87333] transition-colors font-semibold group"
          >
            See examples in the gallery
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
