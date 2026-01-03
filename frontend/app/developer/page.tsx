"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Code, Map as MapIcon, Zap, ArrowRight, Terminal, Cpu, Globe, Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function DeveloperPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-[#f5f0e8] selection:bg-[#c9a962] selection:text-[#0a0f1a] overflow-x-hidden">

            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse"
                    style={{ animationDuration: '8s' }}
                />
                <div
                    className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse"
                    style={{ animationDuration: '10s' }}
                />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, #f5f0e8 39px, #f5f0e8 40px),
                                         repeating-linear-gradient(90deg, transparent, transparent 39px, #f5f0e8 39px, #f5f0e8 40px)`,
                    }}
                />
            </div>

            <div className="relative z-10">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-4">
                    <div className="container mx-auto max-w-6xl text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141d2e] border border-[#f5f0e8]/10 text-[#c9a962] text-sm font-medium mb-8 animate-fade-in">
                            <Rocket className="w-4 h-4" />
                            <span>Developer API v1.0 is now live</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight">
                            Build the Future of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] via-[#b87333] to-[#c9a962] animate-shimmer-text">
                                Digital Cartography
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-[#d4cfc4] max-w-3xl mx-auto mb-12 leading-relaxed opacity-80">
                            Our high-performance API allows you to programmatically generate world-class map posters in seconds. Optimized for print-on-demand and digital assets.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-20">
                            <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-[#c9a962] to-[#b87333] hover:from-[#d9b972] hover:to-[#c88343] text-[#0a0f1a] font-bold border-none shadow-[0_0_20px_rgba(201,169,98,0.3)] animate-glow" asChild>
                                <Link href="/developer/dashboard">Get Started Free</Link>
                            </Button>
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/10 hover:bg-white/5 text-[#f5f0e8] backdrop-blur-sm" asChild>
                                <Link href="/developer/playground">Open Playground</Link>
                            </Button>
                        </div>

                        {/* Animated Code Terminal */}
                        <div className="max-w-4xl mx-auto glass-card rounded-2xl p-1 shadow-2xl animate-float">
                            <div className="bg-[#0a0f1a]/80 backdrop-blur-xl rounded-xl overflow-hidden border border-[#f5f0e8]/5">
                                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                                        <Terminal className="w-3 h-3" />
                                        <span>poster-gen.ts</span>
                                    </div>
                                    <div className="w-12 h-3" /> {/* Spacer */}
                                </div>
                                <div className="p-6 text-left overflow-x-auto font-mono text-sm leading-relaxed">
                                    <div className="flex gap-4">
                                        <div className="text-gray-600 select-none text-right w-4">
                                            1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10
                                        </div>
                                        <code className="text-[#dcdcaa]">
                                            <span className="text-[#569cd6]">const</span> poster = <span className="text-[#569cd6]">await</span> carto.<span className="text-[#dcdcaa]">posters</span>.<span className="text-[#dcdcaa]">generate</span>({`{`}<br />
                                            &nbsp;&nbsp;style: <span className="text-[#ce9178]">'midnight-gold'</span>,<br />
                                            &nbsp;&nbsp;location: {`{`} <span className="text-[#9cdcfe]">center</span>: [<span className="text-[#b5cea8]">-74.006</span>, <span className="text-[#b5cea8]">40.712</span>], <span className="text-[#9cdcfe]">zoom</span>: <span className="text-[#b5cea8]">12</span> {`}`},<br />
                                            &nbsp;&nbsp;format: {`{`} <span className="text-[#9cdcfe]">orientation</span>: <span className="text-[#ce9178]">'portrait'</span>, <span className="text-[#9cdcfe]">size</span>: <span className="text-[#ce9178]">'24x36'</span> {`}`},<br />
                                            &nbsp;&nbsp;labels: [<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;{`{`} <span className="text-[#9cdcfe]">text</span>: <span className="text-[#ce9178]">'New York City'</span>, <span className="text-[#9cdcfe]">font</span>: <span className="text-[#ce9178]">'Manrope-Bold'</span> {`}`}<br />
                                            &nbsp;&nbsp;]<br />
                                            {`}`});<br />
                                            <br />
                                            <span className="text-[#c586c0]">console</span>.<span className="text-[#dcdcaa]">log</span>(<span className="text-[#ce9178]">'Success:'</span>, poster.url);
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Performance Stats */}
                <section className="py-20 border-y border-white/5 bg-white/[0.01]">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-[#c9a962] mb-2">300ms</div>
                                <div className="text-sm text-gray-500 uppercase tracking-widest">Avg latency</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-[#c9a962] mb-2">300DPI</div>
                                <div className="text-sm text-gray-500 uppercase tracking-widest">Print Quality</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-[#c9a962] mb-2">99.9%</div>
                                <div className="text-sm text-gray-500 uppercase tracking-widest">Uptime SLA</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-[#c9a962] mb-2">10k+</div>
                                <div className="text-sm text-gray-500 uppercase tracking-widest">Global Cities</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 px-4 bg-gradient-to-b from-transparent to-[#0a0f1a]">
                    <div className="container mx-auto max-w-6xl">
                        <div className="text-center mb-20">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">Designed for scale</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                Everything you need to build a high-volume map poster business or enrich your app with beautiful geospatial visuals.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: <Globe className="w-6 h-6" />,
                                    title: "Worldwide Coverage",
                                    description: "Access high-precision vector data and satellite imagery for any location on Earth, from metropolis to tiny villages."
                                },
                                {
                                    icon: <Cpu className="w-6 h-6" />,
                                    title: "Cloud Rendering",
                                    description: "Our serverless GPU-accelerated engine renders high-resolution 10,000px assets in less than 5 seconds."
                                },
                                {
                                    icon: <Zap className="w-6 h-6" />,
                                    title: "Instant Webhooks",
                                    description: "Get notified as soon as your renders are ready. Perfect for asynchronous high-volume print workflows."
                                },
                                {
                                    icon: <Code className="w-6 h-6" />,
                                    title: "SDKs for Everyone",
                                    description: "Native libraries for Node.js, Python, and Go. Type-safe, documented, and easy to integrate."
                                },
                                {
                                    icon: <MapIcon className="w-6 h-6" />,
                                    title: "Custom Styling",
                                    description: "Define your own MapLibre styles or use our professionally curated themes optimized for print."
                                },
                                {
                                    icon: <Rocket className="w-6 h-6" />,
                                    title: "CDN Distribution",
                                    description: "All generated assets are automatically uploaded to our globally distributed edge network."
                                }
                            ].map((f, i) => (
                                <div key={i} className="glass-card p-8 rounded-2xl hover:border-[#c9a962]/30 transition-all duration-500 group">
                                    <div className="w-12 h-12 rounded-xl bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] mb-6 group-hover:scale-110 group-hover:bg-[#c9a962]/20 transition-transform">
                                        {f.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                                    <p className="text-gray-400 leading-relaxed">{f.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 px-4">
                    <div className="container mx-auto max-w-4xl glass-card rounded-3xl p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a962]/5 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to start building?</h2>
                            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                                Join 500+ developers creating beautiful map experiences. No credit card required to start.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Button size="lg" className="h-14 px-10 bg-[#f5f0e8] text-[#0a0f1a] hover:bg-white font-bold" asChild>
                                    <Link href="/developer/dashboard">Claim your API Key</Link>
                                </Button>
                                <Button size="lg" variant="ghost" className="h-14 px-10 border border-white/10 hover:bg-white/5" asChild>
                                    <Link href="/developer/docs" className="flex items-center gap-2">
                                        Read the Docs <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Simple Footer */}
                <footer className="py-12 border-t border-white/5 opacity-50 text-sm">
                    <div className="container mx-auto px-4 flex flex-col md:row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <MapIcon className="w-4 h-4" />
                            <span className="font-bold">Carto-Art Developers</span>
                        </div>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-[#c9a962] transition-colors">Documentation</a>
                            <a href="#" className="hover:text-[#c9a962] transition-colors">API Status</a>
                            <a href="#" className="hover:text-[#c9a962] transition-colors">Changelog</a>
                            <a href="#" className="hover:text-[#c9a962] transition-colors">Support</a>
                        </div>
                        <div>© 2026 Carto-Art. Built for creators.</div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
