'use client';

import { useEffect, useState } from 'react';
import { usePlayground } from './PlaygroundContext';
import { MapPreview } from '@/components/map/MapPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Image as ImageIcon, Map as MapIcon, Code, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ResponsePreview() {
    const {
        location, setLocation,
        styleId,
        format,
        response,
        isLoading,
        error
    } = usePlayground();

    const [mapLocalStyle, setMapLocalStyle] = useState<any>(null);
    const [styleLoading, setStyleLoading] = useState(false);

    useEffect(() => {
        if (!styleId) return;
        const fetchStyle = async () => {
            setStyleLoading(true);
            try {
                const res = await fetch(`/api/v1/styles/${styleId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMapLocalStyle(data);
                }
            } catch (e) {
                console.error("Failed to load map style", e);
            } finally {
                setStyleLoading(false);
            }
        };
        fetchStyle();
    }, [styleId]);

    const handleMapMove = (center: [number, number], zoom: number) => {
        setLocation({ center, zoom });
    };

    return (
        <div className="flex flex-col h-full glass-card rounded-2xl overflow-hidden border-[#c9a962]/5 shadow-2xl">
            <Tabs defaultValue="preview" className="flex flex-col h-full">
                <div className="px-6 py-3 border-b border-white/5 bg-white/5 flex justify-between items-center shrink-0">
                    <TabsList className="bg-transparent p-0 gap-6 h-auto">
                        <TabsTrigger
                            value="preview"
                            className="p-0 h-auto bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-[#c9a962] text-gray-500 font-bold text-sm tracking-tight border-b-2 border-transparent data-[state=active]:border-[#c9a962] rounded-none pb-1 transition-all flex items-center gap-2"
                        >
                            <MapIcon className="w-4 h-4" /> Live Map
                        </TabsTrigger>
                        <TabsTrigger
                            value="response"
                            className="p-0 h-auto bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-[#c9a962] text-gray-500 font-bold text-sm tracking-tight border-b-2 border-transparent data-[state=active]:border-[#c9a962] rounded-none pb-1 transition-all flex items-center gap-2"
                        >
                            <Code className="w-4 h-4" /> API Response
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-4">
                        {isLoading && (
                            <div className="flex items-center gap-2 text-[10px] text-[#c9a962] bg-[#c9a962]/10 px-3 py-1 rounded-full border border-[#c9a962]/20 animate-pulse tracking-widest uppercase font-bold">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Processing
                            </div>
                        )}
                        {!isLoading && response && (
                            <div className="text-[10px] text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20 tracking-widest uppercase font-bold">
                                Ready
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-h-0 relative">
                    {/* Tab: Live Interactive Preview */}
                    <TabsContent value="preview" className="h-full m-0 relative overflow-hidden focus-visible:outline-none">
                        {styleLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-[#0a0f1a]/40">
                                <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#c9a962]" />
                                <p className="text-sm font-medium tracking-wide">Loading Vector Style...</p>
                            </div>
                        ) : mapLocalStyle ? (
                            <div className="h-full w-full relative group">
                                <MapPreview
                                    mapStyle={mapLocalStyle.mapStyle}
                                    location={{
                                        center: location.center,
                                        zoom: location.zoom,
                                        name: 'Playground',
                                        bounds: [[0, 0], [0, 0]]
                                    }}
                                    format={{
                                        ...format,
                                        aspectRatio: (format.width / format.height) > 1 ? '16:9' : '2:3',
                                        margin: 0,
                                        borderStyle: 'none',
                                        texture: 'none'
                                    }}
                                    onMove={handleMapMove}
                                    showMarker={true}
                                />
                                {/* Map Overlays */}
                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="px-3 py-1.5 rounded-lg bg-[#0a0f1a]/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#c9a962]">
                                        {location.center[1].toFixed(4)}, {location.center[0].toFixed(4)}
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg bg-[#0a0f1a]/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/60">
                                        Zoom {location.zoom.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-600 p-12 text-center bg-[#0a0f1a]/20">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                    <MapIcon className="w-8 h-8 opacity-40" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-white/40">Viewport Inactive</h3>
                                <p className="max-w-xs mx-auto text-sm text-gray-500">
                                    Please select a map theme from the sidebar to initialize the interactive sandbox.
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: API Response */}
                    <TabsContent value="response" className="h-full m-0 overflow-hidden bg-[#0d1117] relative focus-visible:outline-none">
                        <div className="h-full overflow-y-auto p-6 dev-scrollbar">
                            {error ? (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex gap-4 text-red-400">
                                    <AlertCircle className="h-6 w-6 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-sm tracking-tight">Execution Failed</h4>
                                        <p className="text-sm mt-1 opacity-80">{error}</p>
                                    </div>
                                </div>
                            ) : response ? (
                                <div className="space-y-8 pb-12">
                                    {/* Result Asset Visualization */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <ImageIcon className="w-3 h-3" /> Generated Asset
                                            </h3>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-[#c9a962]" onClick={() => window.open(response.download_url)}>
                                                    <ExternalLink className="w-3 h-3 mr-1" /> View Full
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-[#c9a962]">
                                                    <Download className="w-3 h-3 mr-1" /> Download
                                                </Button>
                                            </div>
                                        </div>

                                        {response.download_url ? (
                                            <div className="relative group rounded-xl overflow-hidden shadow-2xl bg-white/5 p-4 border border-white/5">
                                                <img
                                                    src={response.download_url}
                                                    alt="Generated Map"
                                                    className="max-h-[500px] w-auto mx-auto rounded shadow-lg transition-transform duration-700 group-hover:scale-[1.02]"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-48 glass-card rounded-xl flex flex-col items-center justify-center text-gray-600">
                                                <ImageIcon className="w-8 h-8 mb-2 opacity-30" />
                                                <span className="text-sm">Metadata only result</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Raw JSON Data */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <Code className="w-3 h-3" /> Response Object
                                        </h3>
                                        <div className="relative group">
                                            <pre className="p-5 rounded-xl bg-black/40 border border-white/5 text-xs font-mono text-gray-400 overflow-x-auto">
                                                {JSON.stringify(response, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8 relative">
                                        <div className="absolute inset-0 rounded-full bg-[#c9a962]/10 animate-ping opacity-20" />
                                        <Play className="w-8 h-8 text-[#c9a962] ml-1 fill-current" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white/80 mb-4 tracking-tight">System Ready</h3>
                                    <p className="max-w-sm mx-auto text-gray-500 leading-relaxed">
                                        All parameters are validated. Click the "Execute" button to send an authenticated request to our map generation cluster.
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </div>

                {/* Status Bar */}
                <div className="h-10 px-6 border-t border-white/5 bg-[#0a0f1a]/95 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6 text-[10px] uppercase tracking-widest font-bold text-gray-600">
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#c9a962]" />
                            <span>v1.0.4 rdy</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#c9a962]" />
                            <span>ap-northeast-1</span>
                        </div>
                    </div>
                    <div className="text-[10px] font-mono text-[#c9a962]">
                        {format.width}x{format.height} @ 300dpi
                    </div>
                </div>
            </Tabs>
        </div>
    );
}

function Play({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
    );
}
