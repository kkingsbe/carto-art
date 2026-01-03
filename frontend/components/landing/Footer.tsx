'use client';

import Link from 'next/link';
import { Map, Heart, Shield, Github } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FeedbackTrigger } from '@/components/feedback';

export function Footer() {
  return (
    <footer className="bg-[#0a0f1a] border-t border-[#d4cfc4]/20 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg flex items-center justify-center">
                <Map className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#f5f0e8]">Carto-Art</span>
            </div>
            <p className="text-sm text-[#d4cfc4]/70 leading-relaxed mb-4">
              Free map poster creator. Turn any location into personalized wall art.
            </p>
            {/* Trust badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[#d4cfc4] border-[#d4cfc4]/30 text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Privacy First
              </Badge>
              <Badge variant="outline" className="text-[#d4cfc4] border-[#d4cfc4]/30 text-xs">
                <Github className="w-3 h-3 mr-1" />
                Open Source
              </Badge>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-sm font-bold text-[#f5f0e8] uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/editor" className="text-[#d4cfc4] hover:text-[#c9a962] transition-colors text-sm">
                  Editor
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-[#d4cfc4] hover:text-[#c9a962] transition-colors text-sm">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/developer" className="text-[#d4cfc4] hover:text-[#c9a962] transition-colors text-sm">
                  Developers
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-[#d4cfc4] hover:text-[#c9a962] transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="text-sm font-bold text-[#f5f0e8] uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.openstreetmap.org/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4cfc4] hover:text-[#c9a962] transition-colors text-sm"
                >
                  OpenStreetMap
                </a>
              </li>
              <li>
                <a
                  href="https://wiki.openstreetmap.org/wiki/Legal_FAQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4cfc4] hover:text-[#c9a962] transition-colors text-sm"
                >
                  License Info
                </a>
              </li>
              <li>
                <FeedbackTrigger
                  label="Give Feedback"
                  className="text-[#d4cfc4] hover:text-[#c9a962] text-sm"
                />
              </li>
            </ul>
          </div>

          {/* Built With Column */}
          <div>
            <h3 className="text-sm font-bold text-[#f5f0e8] uppercase tracking-wider mb-4">
              Built With
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Next.js', 'MapLibre', 'Supabase', 'Tailwind'].map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 bg-[#141d2e] rounded text-[#d4cfc4] text-xs border border-[#d4cfc4]/10"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#d4cfc4]/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[#d4cfc4]/50">
            © {new Date().getFullYear()} Carto-Art. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-[#d4cfc4] text-sm">
            Built with
            <Heart className="w-4 h-4 text-red-400 fill-current" />
            and OpenStreetMap data
          </div>
        </div>
      </div>
    </footer>
  );
}
