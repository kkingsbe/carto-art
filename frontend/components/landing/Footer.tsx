'use client';

import Link from 'next/link';
import { Map, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0a0f1a] border-t border-[#d4cfc4]/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#f5f0e8]">Carto-Art</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/editor"
              className="text-[#d4cfc4] hover:text-[#c9a962] transition-colors"
            >
              Editor
            </Link>
            <Link
              href="/gallery"
              className="text-[#d4cfc4] hover:text-[#c9a962] transition-colors"
            >
              Gallery
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4cfc4] hover:text-[#c9a962] transition-colors"
            >
              GitHub
            </a>
          </div>

          {/* Credit */}
          <div className="flex items-center gap-2 text-[#d4cfc4] text-sm">
            Built with
            <Heart className="w-4 h-4 text-red-400 fill-current" />
            and OpenStreetMap data
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-[#d4cfc4]/10 text-center text-sm text-[#d4cfc4]/50">
          © {new Date().getFullYear()} Carto-Art. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
