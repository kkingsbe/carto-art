'use client';

import { PlaygroundProvider } from './PlaygroundContext';
import { RequestControls } from './RequestControls';
import { ResponsePreview } from './ResponsePreview';
import { CodeGenerator } from './CodeGenerator';
import Link from 'next/link';
import { ArrowLeft, Play, Globe } from 'lucide-react';

export function PlaygroundLayout() {
    return (
        <PlaygroundProvider>
            <div className="flex flex-col h-screen bg-[#0a0f1a] text-[#f5f0e8] overflow-hidden">
                {/* Playground Header */}
                <header className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-[#0a0f1a]/80 backdrop-blur-md z-50 shrink-0">
                    <div className="flex items-center gap-6">
                        <Link href="/developer" className="flex items-center gap-2 text-[#c9a962] hover:text-[#b87333] transition-colors group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Hub</span>
                        </Link>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-[#c9a962]" />
                            <h1 className="text-lg font-bold tracking-tight">API Playground</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Live Sandbox
                    </div>
                </header>

                <main className="flex-1 overflow-hidden p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">

                        {/* Sidebar: Controls & Code */}
                        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
                            <div className="flex-1 overflow-y-auto pr-1 dev-scrollbar">
                                <RequestControls />
                            </div>
                            <div className="shrink-0 h-[300px] xl:h-[350px]">
                                <CodeGenerator />
                            </div>
                        </div>

                        {/* Main Area: Preview */}
                        <div className="lg:col-span-8 xl:col-span-9 h-[50vh] lg:h-full relative">
                            <ResponsePreview />

                            {/* Visual decorative flare */}
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#c9a962]/5 rounded-full blur-[100px] pointer-events-none" />
                        </div>

                    </div>
                </main>
            </div>
        </PlaygroundProvider>
    );
}
