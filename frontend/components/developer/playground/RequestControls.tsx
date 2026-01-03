'use client';

import { useEffect, useState } from 'react';
import { usePlayground } from './PlaygroundContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, Settings, MapPin, Key, Layers } from 'lucide-react';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

export function RequestControls() {
    const {
        location, setLocation,
        styleId, setStyleId,
        format, setFormat,
        apiKey, setApiKey,
        isLoading, generatePoster
    } = usePlayground();

    const [styles, setStyles] = useState<any[]>([]);
    const [keys, setKeys] = useState<any[]>([]);
    const [loadingResources, setLoadingResources] = useState(true);

    useEffect(() => {
        const loadResources = async () => {
            try {
                const [stylesRes, keysRes] = await Promise.all([
                    fetch('/api/v1/styles'),
                    fetch('/api/v1/auth/keys')
                ]);

                if (stylesRes.ok) {
                    const data = await stylesRes.json();
                    setStyles(data.styles || []);
                }
                if (keysRes.ok) {
                    const data = await keysRes.json();

                    // Add the sandbox key to the list of available keys
                    const sandboxKey = {
                        id: 'sandbox_demo_key',
                        name: 'Public Sandbox Key',
                        token: 'ca_live_demo_sandbox_key_2024',
                        is_active: true
                    };

                    const userKeys = data.keys || [];
                    const allKeys = [sandboxKey, ...userKeys];
                    setKeys(allKeys);

                    // If we have a current apiKey (which we set to default sandbox), leave it.
                    // If user has keys and wants to switch, they can.
                    // Just ensure if the current apiKey ISN'T in the list (improbable now), we select first.
                    const currentKeyExists = allKeys.some(k => k.token === apiKey);
                    if (!currentKeyExists && allKeys.length > 0) {
                        setApiKey(allKeys[0].token);
                    }
                }
            } catch (err) {
                logger.error('Failed to load playground resources', { err });
            } finally {
                setLoadingResources(false);
            }
        };
        loadResources();
    }, []);

    const updateLocation = (field: keyof typeof location, value: any) => {
        setLocation({ ...location, [field]: value });
    };

    const updateCenter = (index: 0 | 1, val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) return;
        const newCenter = [...location.center] as [number, number];
        newCenter[index] = num;
        setLocation({ ...location, center: newCenter });
    };

    const updateFormat = (field: keyof typeof format, value: any) => {
        setFormat({ ...format, [field]: value });
    };

    if (loadingResources) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 glass-card rounded-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-[#c9a962] mb-4" />
                <p className="text-gray-400 text-sm">Initializing resources...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* API Key */}
            <div className="glass-card rounded-2xl overflow-hidden border-[#c9a962]/10">
                <div className="px-5 py-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#c9a962]" />
                    <span className="text-sm font-bold tracking-tight">Authentication</span>
                </div>
                <div className="p-5 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-500 uppercase tracking-widest pl-1">Target API Key</Label>
                        <Select value={apiKey} onValueChange={setApiKey}>
                            <SelectTrigger className="bg-[#0a0f1a]/50 border-white/5 hover:border-[#c9a962]/30 transition-colors h-11">
                                <SelectValue placeholder="Select an API Key" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141d2e] border-white/10">
                                {keys.map(k => (
                                    <SelectItem key={k.id} value={k.token} className="hover:bg-white/5 focus:bg-white/5 focus:text-[#c9a962]">
                                        {k.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {keys.length === 0 && (
                            <p className="text-[10px] text-orange-400/80 pl-1">
                                No keys found. <a href="/developer" className="underline hover:text-[#c9a962]">Create one</a> to start testing.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Location */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-5 py-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#c9a962]" />
                    <span className="text-sm font-bold tracking-tight">Geospatial Config</span>
                </div>
                <div className="p-5 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1">Latitude</Label>
                            <Input
                                type="number"
                                value={location.center[1]}
                                onChange={(e) => updateCenter(1, e.target.value)}
                                step="0.0001"
                                className="bg-[#0a0f1a]/50 border-white/5 focus:border-[#c9a962]/50 h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1">Longitude</Label>
                            <Input
                                type="number"
                                value={location.center[0]}
                                onChange={(e) => updateCenter(0, e.target.value)}
                                step="0.0001"
                                className="bg-[#0a0f1a]/50 border-white/5 focus:border-[#c9a962]/50 h-11"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <Label className="text-[10px] text-gray-500 uppercase tracking-widest">Zoom Level</Label>
                            <span className="text-sm font-mono text-[#c9a962]">{location.zoom.toFixed(1)}</span>
                        </div>
                        <Slider
                            min={1} max={20} step={0.1}
                            value={[location.zoom]}
                            onValueChange={(vals) => updateLocation('zoom', vals[0])}
                            className="py-2"
                        />
                    </div>
                </div>
            </div>

            {/* Config & Style */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-5 py-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#c9a962]" />
                    <span className="text-sm font-bold tracking-tight">Style & Resolution</span>
                </div>
                <div className="p-5 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1">Map Theme</Label>
                        <Select value={styleId} onValueChange={setStyleId}>
                            <SelectTrigger className="bg-[#0a0f1a]/50 border-white/5 hover:border-[#c9a962]/30 h-11 text-sm">
                                <SelectValue placeholder="Select Style" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141d2e] border-white/10 text-sm">
                                {styles.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="focus:text-[#c9a962]">{s.name || s.id}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1">Orientation</Label>
                        <div className="grid grid-cols-2 gap-2 bg-[#0a0f1a]/50 p-1 rounded-lg border border-white/5">
                            <button
                                onClick={() => updateFormat('orientation', 'portrait')}
                                className={cn(
                                    "flex items-center justify-center gap-2 h-9 rounded-md transition-all text-xs font-bold",
                                    format.orientation === 'portrait'
                                        ? "bg-[#c9a962] text-[#0a0f1a] shadow-lg"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                Portrait
                            </button>
                            <button
                                onClick={() => updateFormat('orientation', 'landscape')}
                                className={cn(
                                    "flex items-center justify-center gap-2 h-9 rounded-md transition-all text-xs font-bold",
                                    format.orientation === 'landscape'
                                        ? "bg-[#c9a962] text-[#0a0f1a] shadow-lg"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                Landscape
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1">Width (px)</Label>
                            <Input
                                type="number"
                                value={format.width}
                                onChange={(e) => updateFormat('width', parseInt(e.target.value))}
                                className="bg-[#0a0f1a]/50 border-white/5 focus:border-[#c9a962]/50 h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1">Height (px)</Label>
                            <Input
                                type="number"
                                value={format.height}
                                onChange={(e) => updateFormat('height', parseInt(e.target.value))}
                                className="bg-[#0a0f1a]/50 border-white/5 focus:border-[#c9a962]/50 h-11"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Button
                className="w-full h-14 text-lg bg-gradient-to-r from-[#c9a962] to-[#b87333] hover:from-[#d9b972] hover:to-[#c88343] text-[#0a0f1a] font-bold rounded-2xl shadow-[0_0_20px_rgba(201,169,98,0.2)] disabled:opacity-50 group"
                onClick={generatePoster}
                disabled={isLoading || !apiKey}
            >
                {isLoading ? (
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                ) : (
                    <Play className="mr-3 h-5 w-5 fill-current transition-transform group-hover:scale-110" />
                )}
                {isLoading ? "Executing..." : "Execute Request"}
            </Button>

            <p className="text-[10px] text-center text-gray-600 uppercase tracking-widest mt-4">
                Requests are processed by v1 cluster
            </p>
        </div>
    );
}
