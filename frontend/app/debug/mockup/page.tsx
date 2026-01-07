'use client';

import { useState, useEffect } from 'react';
import { FrameMockupRenderer } from '@/components/ecommerce/FrameMockupRenderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMarginAdjustedVariants } from '@/lib/actions/ecommerce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DebugMockupPage() {
    const [templateUrl, setTemplateUrl] = useState<string>('https://printful-upload.s3-accelerate.amazonaws.com/tmp/61c381e4bec5273aef0da64ff4339fe0/canvas-(in)-10x10-wall-695e6ed98dea0.png');
    const [designUrl, setDesignUrl] = useState<string>('');
    const [officialMockupUrl, setOfficialMockupUrl] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [printArea, setPrintArea] = useState({
        x: 0.12,
        y: 0.08,
        width: 0.76,
        height: 0.84
    });
    const [logs, setLogs] = useState<string[]>([]);
    const [variants, setVariants] = useState<any[]>([]);
    const [selectedVariantId, setSelectedVariantId] = useState<string>('');
    const [debugStages, setDebugStages] = useState<{ name: string; url: string; description?: string }[]>([]);

    const handleLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]} - ${message}`]);
    };

    useEffect(() => {
        const loadVariants = async () => {
            try {
                handleLog('Loading variants...');
                const data = await getMarginAdjustedVariants();
                setVariants(data);
                handleLog(`Loaded ${data.length} variants`);
            } catch (error) {
                handleLog(`Error loading variants: ${error}`);
            }
        };
        loadVariants();
    }, []);

    const clearLogs = () => setLogs([]);

    const handleVariantChange = (variantId: string) => {
        setSelectedVariantId(variantId);
        const variant = variants.find(v => v.id.toString() === variantId);
        if (variant) {
            handleLog(`Selected variant: ${variant.name}`);
            if (variant.mockup_template_url) {
                setTemplateUrl(variant.mockup_template_url);
            }
            if (variant.mockup_print_area) {
                try {
                    const area = typeof variant.mockup_print_area === 'string'
                        ? JSON.parse(variant.mockup_print_area)
                        : variant.mockup_print_area;

                    if (area.x !== undefined) {
                        setPrintArea(area);
                    }
                } catch (e) {
                    handleLog(`Error parsing print area: ${e}`);
                }
            }
        }
    };

    const handleGenerateOfficial = async () => {
        if (!designUrl) {
            handleLog('Error: No design URL provided');
            return;
        }
        if (designUrl.startsWith('blob:')) {
            handleLog('Error: Printful API cannot access blob URLs. Please use a public URL.');
            return;
        }
        if (!selectedVariantId) {
            handleLog('Error: No variant selected');
            return;
        }

        setIsGenerating(true);
        handleLog('Requesting official Printful mockup...');
        setOfficialMockupUrl('');

        try {
            const res = await fetch('/api/printful/mockup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    variant_id: parseInt(selectedVariantId),
                    image_url: designUrl
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate mockup');
            }

            handleLog(`Official mockup generated: ${data.mockup_url}`);
            setOfficialMockupUrl(data.mockup_url);

        } catch (error: any) {
            handleLog(`Error generating official mockup: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-8">
            <h1 className="text-3xl font-bold">Mockup Renderer Laboratory</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Select Product Variant</Label>
                            <Select value={selectedVariantId} onValueChange={handleVariantChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a variant..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {variants.map(v => (
                                        <SelectItem key={v.id} value={v.id.toString()}>
                                            {v.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Template URL</Label>
                            <Input
                                value={templateUrl}
                                onChange={(e) => setTemplateUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Design URL</Label>
                            <Input
                                value={designUrl}
                                onChange={(e) => setDesignUrl(e.target.value)}
                                placeholder="blob:..."
                            />
                            <p className="text-xs text-muted-foreground">
                                Tip: Copy a blob URL from the main app network tab or use a public image URL for official comparison.
                            </p>
                        </div>

                        <div className="space-y-4 border p-4 rounded-md">
                            <h3 className="font-medium">Print Area</h3>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>X ({printArea.x.toFixed(3)})</Label>
                                </div>
                                <Slider
                                    value={[printArea.x]}
                                    min={0} max={1} step={0.001}
                                    onValueChange={([val]) => setPrintArea(p => ({ ...p, x: val }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Y ({printArea.y.toFixed(3)})</Label>
                                </div>
                                <Slider
                                    value={[printArea.y]}
                                    min={0} max={1} step={0.001}
                                    onValueChange={([val]) => setPrintArea(p => ({ ...p, y: val }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Width ({printArea.width.toFixed(3)})</Label>
                                </div>
                                <Slider
                                    value={[printArea.width]}
                                    min={0} max={1} step={0.001}
                                    onValueChange={([val]) => setPrintArea(p => ({ ...p, width: val }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Height ({printArea.height.toFixed(3)})</Label>
                                </div>
                                <Slider
                                    value={[printArea.height]}
                                    min={0} max={1} step={0.001}
                                    onValueChange={([val]) => setPrintArea(p => ({ ...p, height: val }))}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={handleGenerateOfficial}
                                disabled={isGenerating || !selectedVariantId || !designUrl}
                                className="w-full"
                            >
                                {isGenerating ? 'Generating Official Preview...' : 'Generate Official Preview'}
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={async () => {
                                    if (!selectedVariantId) return;
                                    handleLog(`Debugging variant ${selectedVariantId}...`);
                                    try {
                                        const { debugMockupResponse } = await import('@/lib/actions/printful');
                                        const res = await debugMockupResponse(parseInt(selectedVariantId));
                                        handleLog('Debug Response:');
                                        handleLog(JSON.stringify(res, null, 2));
                                    } catch (e: any) {
                                        handleLog(`Debug Error: ${e.message}`);
                                    }
                                }}
                                disabled={!selectedVariantId}
                                className="w-full"
                            >
                                Debug API Response (Console)
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={async () => {
                                    if (!selectedVariantId) return;
                                    if (!confirm('This will overwrite the current template URL and print area. Continue?')) return;

                                    handleLog(`Regenerating template for variant ${selectedVariantId}...`);
                                    try {
                                        const { regenerateVariantMockup } = await import('@/lib/actions/printful');
                                        const res = await regenerateVariantMockup(parseInt(selectedVariantId));
                                        handleLog('Regenerate Success!');
                                        handleLog(`New URL: ${res.mockupUrl}`);
                                        handleLog(`New Print Area: ${JSON.stringify(res.printArea)}`);

                                        // Update local state to reflect change immediately
                                        setTemplateUrl(res.mockupUrl);
                                        setPrintArea(res.printArea);
                                    } catch (e: any) {
                                        handleLog(`Regenerate Error: ${e.message}`);
                                    }
                                }}
                                disabled={!selectedVariantId}
                                className="w-full"
                            >
                                Regenerate Template Data
                            </Button>

                            <Button variant="outline" onClick={clearLogs} className="w-full">Clear Logs</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview */}
                <Card className={officialMockupUrl ? "lg:col-span-2" : ""}>
                    <CardHeader>
                        <CardTitle>Preview Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`grid gap-4 ${officialMockupUrl ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                            {/* Client Side Preview */}
                            <div className="space-y-2">
                                <h3 className="font-medium text-sm text-center text-muted-foreground">Client Composite</h3>
                                <div className="min-h-[400px] flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden border relative">
                                    {templateUrl && designUrl ? (
                                        <FrameMockupRenderer
                                            templateUrl={templateUrl}
                                            designUrl={designUrl}
                                            printArea={printArea}
                                            // @ts-ignore - Debug prop
                                            onDebug={handleLog}
                                            onDebugStages={setDebugStages}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            Select a variant and enter a design URL
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Official Preview */}
                            {officialMockupUrl && (
                                <div className="space-y-2">
                                    <h3 className="font-medium text-sm text-center text-muted-foreground">Official Printful Preview</h3>
                                    <div className="min-h-[400px] flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden border relative">
                                        <img
                                            src={officialMockupUrl}
                                            alt="Official Printful Mockup"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>


                {/* Debug Stages */}
                {debugStages.length > 0 && (
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Processing Stages</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {debugStages.map((stage, i) => (
                                    <div key={i} className="space-y-2 border p-2 rounded-lg">
                                        <div className="font-medium text-sm truncate" title={stage.name}>{stage.name}</div>
                                        <div className="aspect-square relative bg-gray-100 rounded overflow-hidden">
                                            <img src={stage.url} alt={stage.name} className="w-full h-full object-contain" />
                                        </div>
                                        {stage.description && (
                                            <p className="text-xs text-muted-foreground">{stage.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Logs Console */}
            <Card>
                <CardHeader>
                    <CardTitle>Debug Console</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-md h-64 overflow-y-auto">
                        {logs.length === 0 ? (
                            <span className="text-gray-500">// Waiting for logs...</span>
                        ) : (
                            logs.map((log, i) => <div key={i}>{log}</div>)
                        )}
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
