'use client';

import Link from 'next/link';
import { Map, Heart, Shield, Github, Twitter, Instagram } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FeedbackTrigger } from '@/components/feedback';
import { ChangelogModal } from '@/components/changelog/ChangelogModal';

export function Footer() {
  return (
    <footer className="bg-[#05080f] border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

          {/* Brand Column */}
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a962] to-[#b87333] shadow-lg shadow-[#c9a962]/20 flex items-center justify-center">
                <Map className="w-5 h-5 text-[#0a0f1a]" />
              </div>
              <span className="text-2xl font-bold text-[#f5f0e8] tracking-tight">Carto-Art</span>
            </Link>

            <p className="text-[#d4cfc4]/60 leading-relaxed max-w-sm">
              The professional map poster creator. Turn your favorite memories into museum-quality wall art.
              <br />Open source and free forever.
            </p>

            <div className="flex gap-4 pt-2">
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#c9a962] text-[#d4cfc4] transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#c9a962] text-[#d4cfc4] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#c9a962] text-[#d4cfc4] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-2 md:col-start-6">
            <h3 className="text-sm font-bold text-[#f5f0e8] uppercase tracking-wider mb-6">Product</h3>
            <ul className="space-y-4">
              <li><Link href="/editor" className="text-[#d4cfc4]/70 hover:text-[#c9a962] transition-colors">Editor</Link></li>
              <li><Link href="/gallery" className="text-[#d4cfc4]/70 hover:text-[#c9a962] transition-colors">Gallery</Link></li>
              <li><Link href="/showcase" className="text-[#d4cfc4]/70 hover:text-[#c9a962] transition-colors">Showcase</Link></li>
              <li>
                <ChangelogModal
                  trigger={
                    <button className="text-[#d4cfc4]/70 hover:text-[#c9a962] transition-colors text-left">
                      Changelog
                    </button>
                  }
                />
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-bold text-[#f5f0e8] uppercase tracking-wider mb-6">Resources</h3>
            <ul className="space-y-4">
              <li><Link href="/developer" className="text-[#d4cfc4]/70 hover:text-[#c9a962] transition-colors">Developers</Link></li>
              <li><Link href="/docs" className="text-[#d4cfc4]/70 hover:text-[#c9a962] transition-colors">Documentation</Link></li>
              <li>
                <ChangelogModal
                  trigger={
                    <button className="text-[#d4cfc4]/70 hover:text-[#c9a962] transition-colors text-sm">
                      Changelog
                    </button>
                  }
                />
              </li>
              <li><Link href="/blog" className="text-[#d4cfc4]/70 hover:text-[#c9a962] transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-sm font-bold text-[#f5f0e8] uppercase tracking-wider mb-6">Stay Updated</h3>
            <p className="text-sm text-[#d4cfc4]/60 mb-4">Get the latest features and styles delivered to your inbox.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-[#f5f0e8] placeholder:text-[#d4cfc4]/30 w-full focus:outline-none focus:border-[#c9a962]/50"
              />
              <button className="px-4 py-2 bg-[#c9a962] text-[#0a0f1a] font-bold rounded-lg hover:bg-[#b87333] transition-colors text-sm">
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[#d4cfc4]/40">
            © {new Date().getFullYear()} Carto-Art. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#d4cfc4]/40">
            <Link href="/privacy" className="hover:text-[#d4cfc4] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#d4cfc4] transition-colors">Terms of Service</Link>
            <div className="flex items-center gap-2 pl-6 border-l border-white/10">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-current animate-pulse" />
              <span>and OpenStreetMap</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

