'use client';

import { Check, X } from 'lucide-react';

const features = [
  { name: 'Price per poster', cartoArt: 'Free', competitors: '$49-89' },
  { name: 'Signup required', cartoArt: false, competitors: true },
  { name: 'Layer control', cartoArt: 'Full', competitors: 'Limited' },
  { name: 'GPU terrain shading', cartoArt: true, competitors: false },
  { name: 'Max resolution', cartoArt: '7200×10800px', competitors: '3600×5400px' },
  { name: 'Real-time color swap', cartoArt: true, competitors: false },
];

export function Comparison() {
  return (
    <section className="py-24 bg-[#0a0f1a]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#f5f0e8] mb-4">
            The Free Alternative to
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] to-[#b87333]">
              Mapiful & Grafomap
            </span>
          </h2>
        </div>

        {/* Comparison Table */}
        <div className="bg-[#141d2e] rounded-xl overflow-hidden border border-[#d4cfc4]/20 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#d4cfc4]/20">
                  <th className="text-left py-4 px-6 text-[#d4cfc4] font-semibold">
                    Feature
                  </th>
                  <th className="text-center py-4 px-6 text-[#c9a962] font-bold">
                    Carto-Art
                  </th>
                  <th className="text-center py-4 px-6 text-[#d4cfc4] font-semibold">
                    Competitors
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={feature.name}
                    className={index !== features.length - 1 ? 'border-b border-[#d4cfc4]/10' : ''}
                  >
                    <td className="py-4 px-6 text-[#f5f0e8]">
                      {feature.name}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.cartoArt === 'boolean' ? (
                        feature.cartoArt ? (
                          <Check className="w-6 h-6 text-[#c9a962] mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-[#c9a962] font-semibold">
                          {feature.cartoArt}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.competitors === 'boolean' ? (
                        feature.competitors ? (
                          <Check className="w-6 h-6 text-[#d4cfc4]/50 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-red-400/50 mx-auto" />
                        )
                      ) : (
                        <span className="text-[#d4cfc4]/70">
                          {feature.competitors}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
