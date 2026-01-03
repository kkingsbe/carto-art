'use client';

import { useEffect } from 'react';
import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';
import Link from 'next/link';
import { ArrowLeft, Book, Code, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DeveloperDocsPage() {
    // Monitor Scalar's response panel and inject image previews for poster generation responses
    useEffect(() => {
        const injectImagePreview = () => {
            // Find all pre and code elements which typically hold the JSON response, plus specific Scalar classes
            const responseContainers = document.querySelectorAll('pre, code, .scalar-code-block, [class*="language-"]');

            responseContainers.forEach((container) => {
                // Only skip if the content hasn't changed (we'll check data-injected-url later)
                // if (container.getAttribute('data-image-injected') === 'true') return;

                const text = container.textContent || '';

                // Check if this looks like a poster generation response with download_url
                // Relaxed check: just look for download_url in the text
                if (text.includes('"download_url"')) {
                    console.log('[Docs] Found potential poster response in ' + container.tagName);
                    try {
                        // Helper to try parsing JSON that might have line numbers or other artifacts
                        const cleanAndParseJson = (str: string) => {
                            // 1. Try simple extraction first
                            const firstBrace = str.indexOf('{');
                            const lastBrace = str.lastIndexOf('}');
                            if (firstBrace === -1 || lastBrace === -1) return null;

                            const candidate = str.substring(firstBrace, lastBrace + 1);

                            try {
                                return JSON.parse(candidate);
                            } catch (e) {
                                // 2. If simple parse fails, try cleaning line numbers
                                // Scalar/CodeMirror might mix line numbers into textContent: "1 { 2 "id":..."
                                const lines = candidate.split('\n');
                                const cleanedLines = lines.map(line => {
                                    // Remove leading digits and spaces/tabs (likely line numbers)
                                    // But be careful not to remove digits that are part of JSON keys/values if they are at start of line (unlikely for indented JSON)
                                    return line.replace(/^\s*\d+\s+/, '').trim();
                                    // Note: trim() might be too aggressive if indentation matters for some weird strings, but for JSON it's fine outside of string values.
                                    // Actually, simple JSON keys don't start with numbers usually.
                                });
                                const cleanedCandidate = cleanedLines.join('\n');
                                try {
                                    return JSON.parse(cleanedCandidate);
                                } catch (e2) {
                                    // 3. Last resort: try to find just the raw text if it's mixed in a known way
                                    // or just return null and log failure
                                    return null;
                                }
                            }
                        };

                        const parsed = cleanAndParseJson(text);

                        if (parsed && parsed.download_url && (parsed.status === 'completed' || parsed.status === 'success')) {
                            // Validate URL to prevent 404s from "string" placeholders
                            if ((!parsed.download_url.startsWith('http') && !parsed.download_url.startsWith('blob:')) || parsed.download_url.includes('example.com')) {
                                console.log('[Docs] Skipping invalid/placeholder URL:', parsed.download_url);
                                return;
                            }

                            // check if we already injected THIS url
                            const currentInjectedUrl = container.getAttribute('data-injected-url');
                            console.log('[Docs] Checking injection. Current:', currentInjectedUrl, 'New:', parsed.download_url);

                            if (currentInjectedUrl === parsed.download_url) {
                                console.log('[Docs] URL match, skipping injection');
                                return;
                            }

                            // If we have a different URL injected, remove the old preview first
                            if (currentInjectedUrl && container.parentElement) {
                                console.log('[Docs] Removing old preview for URL:', currentInjectedUrl);
                                const oldPreview = container.parentElement.querySelector('.carto-image-preview');
                                if (oldPreview) {
                                    oldPreview.remove();
                                } else {
                                    console.warn('[Docs] Could not find .carto-image-preview to remove');
                                }
                            }

                            console.log('[Docs] Injecting new preview for:', parsed.download_url);

                            // Create image preview element
                            const previewDiv = document.createElement('div');
                            previewDiv.className = 'carto-image-preview';
                            previewDiv.innerHTML = `
                                <div style="
                                    margin-bottom: 16px;
                                    padding: 16px;
                                    background: linear-gradient(135deg, rgba(201, 169, 98, 0.1), rgba(184, 115, 51, 0.05));
                                    border: 1px solid rgba(201, 169, 98, 0.2);
                                    border-radius: 12px;
                                ">
                                    <div style="
                                        display: flex;
                                        align-items: center;
                                        justify-content: space-between;
                                        margin-bottom: 12px;
                                    ">
                                        <span style="
                                            font-size: 11px;
                                            font-weight: 700;
                                            text-transform: uppercase;
                                            letter-spacing: 0.1em;
                                            color: #c9a962;
                                        ">✨ Generated Poster</span>
                                        <div style="display: flex; gap: 8px;">
                                            <a href="${parsed.download_url}" target="_blank" rel="noopener" style="
                                                display: inline-flex;
                                                align-items: center;
                                                gap: 4px;
                                                padding: 6px 12px;
                                                font-size: 11px;
                                                font-weight: 600;
                                                color: #c9a962;
                                                background: rgba(201, 169, 98, 0.1);
                                                border: 1px solid rgba(201, 169, 98, 0.3);
                                                border-radius: 6px;
                                                text-decoration: none;
                                                transition: all 0.2s;
                                            " onmouseover="this.style.background='rgba(201, 169, 98, 0.2)'" onmouseout="this.style.background='rgba(201, 169, 98, 0.1)'">
                                                View Full Size ↗
                                            </a>
                                            <a href="${parsed.download_url}" download style="
                                                display: inline-flex;
                                                align-items: center;
                                                gap: 4px;
                                                padding: 6px 12px;
                                                font-size: 11px;
                                                font-weight: 600;
                                                color: #0a0f1a;
                                                background: #c9a962;
                                                border: 1px solid #c9a962;
                                                border-radius: 6px;
                                                text-decoration: none;
                                                transition: all 0.2s;
                                            " onmouseover="this.style.background='#b87333'; this.style.borderColor='#b87333'" onmouseout="this.style.background='#c9a962'; this.style.borderColor='#c9a962'">
                                                ↓ Download
                                            </a>
                                        </div>
                                    </div>
                                    <div style="
                                        position: relative;
                                        border-radius: 8px;
                                        overflow: hidden;
                                        background: #0a0f1a;
                                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
                                    ">
                                        <img 
                                            src="${parsed.download_url}" 
                                            alt="Generated Map Poster" 
                                            style="
                                                display: block;
                                                max-width: 100%;
                                                max-height: 500px;
                                                width: auto;
                                                margin: 0 auto;
                                            "
                                            onerror="this.parentElement.parentElement.style.display='none'"
                                        />
                                    </div>
                                    ${parsed.metadata ? `
                                        <div style="
                                            display: flex;
                                            gap: 16px;
                                            margin-top: 12px;
                                            font-size: 11px;
                                            color: #888;
                                        ">
                                            ${parsed.metadata.dimensions ? `<span>📐 ${parsed.metadata.dimensions}</span>` : ''}
                                            ${parsed.metadata.file_size_bytes ? `<span>💾 ${(parsed.metadata.file_size_bytes / 1024 / 1024).toFixed(1)} MB</span>` : ''}
                                            ${parsed.metadata.render_time_ms ? `<span>⏱️ ${(parsed.metadata.render_time_ms / 1000).toFixed(1)}s render</span>` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                            `;

                            // Insert before the JSON response
                            container.parentElement?.insertBefore(previewDiv, container);
                            container.setAttribute('data-image-injected', 'true');
                            container.setAttribute('data-injected-url', parsed.download_url);
                        }
                    } catch (e) {
                        // JSON parsing failed, ignore
                    }
                }
            });
        };

        // Run periodically to catch new responses (polling as backup for Observer)
        const pollInterval = setInterval(() => {
            injectImagePreview();
        }, 1000);

        const observer = new MutationObserver(() => {
            injectImagePreview();
        });

        // Start observing once Scalar loads
        const startObserving = () => {
            // Observe the entire body to catch portals/modals
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
            injectImagePreview();
        };

        // Also run immediately in case we're already loaded
        injectImagePreview();

        startObserving();

        return () => {
            observer.disconnect();
            clearInterval(pollInterval);
        };
    }, []);
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
                        url: '/api/v1/openapi.json',
                        // Wait, I should not change this if I am not sure of the type definition. 
                        // But I CAN add logging to the injection script effectively.

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
                            securitySchemes: {
                                bearerAuth: {
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
