'use client';

import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';
import Link from 'next/link';
import { ArrowLeft, Book, Code, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DeveloperDocsPage() {
    return (
        <div className="h-screen w-full bg-[#0a0f1a] flex flex-col overflow-hidden text-[#f5f0e8]">
            {/* Custom Docs Header */}
            <header className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-[#0a0f1a]/80 backdrop-blur-md z-50 shrink-0">
                <div className="flex items-center gap-6">
                    <Link href="/developer" className="flex items-center gap-2 text-[#c9a962] hover:text-[#b87333] transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Hub</span>
                    </Link>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex items-center gap-2">
                        <Book className="w-5 h-5 text-[#c9a962]" />
                        <h1 className="text-lg font-bold tracking-tight">API Documentation</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" asChild>
                        <Link href="/developer/playground" className="flex items-center gap-2">
                            <Play className="w-4 h-4" /> Playground
                        </Link>
                    </Button>
                    <Button size="sm" className="bg-[#c9a962] text-[#0a0f1a] hover:bg-[#b87333]" asChild>
                        <Link href="/developer/dashboard">Get API Key</Link>
                    </Button>
                </div>
            </header>

            <div className="flex-1 overflow-hidden relative">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#c9a962]/5 blur-[100px] pointer-events-none" />

                <ApiReferenceReact
                    configuration={{
                        spec: {
                            url: '/api/v1/openapi.json',
                        },
                        theme: 'none', // We use custom CSS
                        darkMode: true,
                        hideModels: true,
                        customCss: `
                            :root {
                                --scalar-primary: #c9a962;
                                --scalar-background-1: #0a0f1a;
                                --scalar-background-2: #141d2e;
                                --scalar-color-1: #f5f0e8;
                                --scalar-border-color: rgba(255, 255, 255, 0.08);
                            }
                            .scalar-app { font-family: inherit; }
                            .section-header { color: var(--scalar-primary) !important; }
                        `,
                        proxy: '',
                        authentication: {
                            preferredSecurityScheme: 'bearerAuth',
                            http: {
                                bearer: {
                                    token: 'ca_live_demo_sandbox_key_2024',
                                },
                            },
                        },
                    } as any}
                />
            </div>
        </div>
    );
}
