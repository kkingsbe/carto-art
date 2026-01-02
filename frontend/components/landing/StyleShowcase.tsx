'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { styleComparisons } from '@/lib/data/styleShowcase';
import { ArrowRight } from 'lucide-react';

export function StyleShowcase() {
  return (
    <section className="py-24 bg-[#f5f0e8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0a0f1a] mb-4">
            Same Data.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] to-[#b87333]">
              Totally Different Vibe.
            </span>
          </h2>
          <p className="text-lg text-[#141d2e]/70 max-w-2xl mx-auto">
            See how different styles transform the same location into unique art
          </p>
        </div>

        {/* Tabs for different locations */}
        <Tabs defaultValue={styleComparisons[0]?.id} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-12 bg-white/50 p-1">
            {styleComparisons.map((comparison) => (
              <TabsTrigger
                key={comparison.id}
                value={comparison.id}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#c9a962] data-[state=active]:to-[#b87333] data-[state=active]:text-[#0a0f1a] text-[#141d2e]/70 font-semibold"
              >
                {comparison.location}
              </TabsTrigger>
            ))}
          </TabsList>

          {styleComparisons.map((comparison) => (
            <TabsContent key={comparison.id} value={comparison.id} className="mt-0">
              <div className="max-w-5xl mx-auto">
                {/* Before/After Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Before */}
                  <div className="relative group">
                    <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-[#141d2e]/80 backdrop-blur-sm rounded-lg text-[#f5f0e8] font-semibold">
                      {comparison.beforeStyle}
                    </div>
                    <div className="aspect-[4/5] bg-white rounded-lg overflow-hidden shadow-lg border border-[#0a0f1a]/10">
                      <img
                        src={comparison.beforeImage}
                        alt={`${comparison.location} - ${comparison.beforeStyle} style`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* After */}
                  <div className="relative group">
                    <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-gradient-to-r from-[#c9a962] to-[#b87333] rounded-lg text-[#0a0f1a] font-semibold shadow-lg">
                      {comparison.afterStyle}
                    </div>
                    <div className="aspect-[4/5] bg-white rounded-lg overflow-hidden shadow-xl border-2 border-[#c9a962] group-hover:shadow-2xl transition-shadow">
                      <img
                        src={comparison.afterImage}
                        alt={`${comparison.location} - ${comparison.afterStyle} style`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-lg shadow-sm border border-[#0a0f1a]/10">
                    <ArrowRight className="w-5 h-5 text-[#c9a962]" />
                    <p className="text-[#141d2e] font-medium">
                      {comparison.description}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

      </div>
    </section>
  );
}
