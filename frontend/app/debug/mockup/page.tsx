'use client';

import { useState, useEffect } from 'react';
import { FrameMockupRenderer } from '@/components/ecommerce/FrameMockupRenderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMarginAdjustedVariants, getImportedProductIds } from '@/lib/actions/ecommerce';
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
    const [magentaBounds, setMagentaBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [templateAnalysis, setTemplateAnalysis] = useState<{
        templateDimensions: { width: number; height: number };
        detectedBounds: { x: number; y: number; width: number; height: number };
        printAreaPixels: { x: number; y: number; width: number; height: number };
    } | null>(null);

    const handleLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]} - ${message}`]);
    };

    const analyzeTemplate = async (templateUrl: string, printArea: any) => {
        if (!templateUrl) return;

        try {
            handleLog('Analyzing template for magenta bounds...');

            // Call server-side API to analyze the template
            const response = await fetch('/api/debug/analyze-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateUrl,
                    printArea
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            setTemplateAnalysis(result.analysis);
            setMagentaBounds(result.magentaBounds);

            handleLog(`Detected magenta bounds: ${JSON.stringify(result.magentaBounds)}`);
            handleLog(`Print area pixels: ${JSON.stringify(result.analysis.printAreaPixels)}`);
            handleLog(`Template analysis complete`);

        } catch (error: any) {
            handleLog(`Template analysis failed: ${error.message || error}`);
            console.error('Template analysis error:', error);
        }
    };

    useEffect(() => {
        const loadVariants = async () => {
            try {
                handleLog('Loading variants...');
                const [data, importedProductIds] = await Promise.all([
                    getMarginAdjustedVariants(),
                    getImportedProductIds()
                ]);
                // Filter to only show variants from imported products
                const importedVariants = data.filter(v => 
                    v.product_id && importedProductIds.includes(v.product_id)
                );
                setVariants(importedVariants);
                handleLog(`Loaded ${importedVariants.length} imported variants (filtered from ${data.length} total)`);
            } catch (error) {
                handleLog(`Error loading variants: ${error}`);
            }
        };
        loadVariants();
    }, []);

    // Analyze template when URL or print area changes
    useEffect(() => {
        if (templateUrl && printArea.x !== undefined) {
            analyzeTemplate(templateUrl, printArea);
        }
    }, [templateUrl, printArea]);

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
                        // Analyze template when print area changes
                        if (variant.mockup_template_url) {
                            analyzeTemplate(variant.mockup_template_url, area);
                        }
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
            // First, upload the design with rotation if needed
            handleLog('Uploading design to Printful (with rotation if needed)...');
            const uploadRes = await fetch('/api/printful/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: designUrl,
                    variant_id: parseInt(selectedVariantId)
                })
            });

            if (!uploadRes.ok) {
                throw new Error('Failed to upload design');
            }

            const uploadData = await uploadRes.json();
            handleLog(`Design uploaded (rotated: ${uploadData.rotated}), file ID: ${uploadData.id}`);
            
            // Use the rotated image URL if available, otherwise fall back to preview_url or original
            const imageUrlForMockup = uploadData.image_url || uploadData.preview_url || designUrl;
            handleLog(`Using image URL for mockup: ${imageUrlForMockup.substring(0, 80)}...`);

            // Then generate mockup with the uploaded file
            const res = await fetch('/api/printful/mockup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    variant_id: parseInt(selectedVariantId),
                    image_url: imageUrlForMockup
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
                {/* Template Analysis */}
                {templateUrl && (
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Template Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {templateAnalysis ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Template with overlays */}
                                <div className="space-y-2">
                                    <h3 className="font-medium text-sm">Template with Print Area Overlays</h3>
                                    <div className="relative bg-gray-100 rounded-lg overflow-hidden border">
                                        <img
                                            src={templateUrl}
                                            alt="Template"
                                            className="w-full h-auto max-h-[400px] object-contain"
                                            style={{ imageRendering: 'pixelated' }}
                                        />
                                        {/* Magenta bounds overlay */}
                                        {magentaBounds && (
                                            <div
                                                className="absolute border-2 border-red-500 bg-red-500/20"
                                                style={{
                                                    left: `${magentaBounds.x * 100}%`,
                                                    top: `${magentaBounds.y * 100}%`,
                                                    width: `${magentaBounds.width * 100}%`,
                                                    height: `${magentaBounds.height * 100}%`,
                                                }}
                                                title="Detected magenta bounds"
                                            />
                                        )}
                                        {/* Print area overlay */}
                                        <div
                                            className="absolute border-2 border-blue-500 bg-blue-500/20"
                                            style={{
                                                left: `${printArea.x * 100}%`,
                                                top: `${printArea.y * 100}%`,
                                                width: `${printArea.width * 100}%`,
                                                height: `${printArea.height * 100}%`,
                                            }}
                                            title="Configured print area"
                                        />
                                        {/* Legend */}
                                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-red-500 border border-red-300"></div>
                                                <span>Magenta Bounds</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-3 h-3 bg-blue-500 border border-blue-300"></div>
                                                <span>Print Area</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Analysis details */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-sm mb-2">Template Dimensions</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {templateAnalysis.templateDimensions.width} × {templateAnalysis.templateDimensions.height} pixels
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-sm mb-2">Detected Magenta Bounds</h4>
                                        <div className="text-sm space-y-1">
                                            <p>X: {(magentaBounds?.x || 0).toFixed(3)} ({(magentaBounds?.x || 0) * templateAnalysis.templateDimensions.width}px)</p>
                                            <p>Y: {(magentaBounds?.y || 0).toFixed(3)} ({(magentaBounds?.y || 0) * templateAnalysis.templateDimensions.height}px)</p>
                                            <p>Width: {(magentaBounds?.width || 0).toFixed(3)} ({(magentaBounds?.width || 0) * templateAnalysis.templateDimensions.width}px)</p>
                                            <p>Height: {(magentaBounds?.height || 0).toFixed(3)} ({(magentaBounds?.height || 0) * templateAnalysis.templateDimensions.height}px)</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-sm mb-2">Configured Print Area (Pixels)</h4>
                                        <div className="text-sm space-y-1">
                                            <p>X: {templateAnalysis.printAreaPixels.x.toFixed(1)}px</p>
                                            <p>Y: {templateAnalysis.printAreaPixels.y.toFixed(1)}px</p>
                                            <p>Width: {templateAnalysis.printAreaPixels.width.toFixed(1)}px</p>
                                            <p>Height: {templateAnalysis.printAreaPixels.height.toFixed(1)}px</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-sm mb-2">Orientation Analysis</h4>
                                        <div className="text-sm space-y-1">
                                            <p>Magenta bounds: {magentaBounds && magentaBounds.width > magentaBounds.height ? 'Landscape' : 'Portrait'}</p>
                                            <p>Print area: {printArea.width > printArea.height ? 'Landscape' : 'Portrait'}</p>
                                            <p className={magentaBounds && ((magentaBounds.width > magentaBounds.height) !== (printArea.width > printArea.height)) ? 'text-red-600 font-medium' : ''}>
                                                Match: {magentaBounds && ((magentaBounds.width > magentaBounds.height) === (printArea.width > printArea.height)) ? 'Yes' : 'No'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">Analyzing template...</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        If analysis fails, try clicking "Analyze Template" manually.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

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
                                <div className="flex justify-between items-center">
                                    <Label>X</Label>
                                    <Input
                                        type="number"
                                        value={printArea.x.toFixed(3)}
                                        onChange={(e) => setPrintArea(p => ({ ...p, x: parseFloat(e.target.value) || 0 }))}
                                        className="w-20 h-6 text-xs"
                                        step="0.001"
                                        min="0"
                                        max="1"
                                    />
                                </div>
                                <Slider
                                    value={[printArea.x]}
                                    min={0} max={1} step={0.001}
                                    onValueChange={([val]) => setPrintArea(p => ({ ...p, x: val }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Y</Label>
                                    <Input
                                        type="number"
                                        value={printArea.y.toFixed(3)}
                                        onChange={(e) => setPrintArea(p => ({ ...p, y: parseFloat(e.target.value) || 0 }))}
                                        className="w-20 h-6 text-xs"
                                        step="0.001"
                                        min="0"
                                        max="1"
                                    />
                                </div>
                                <Slider
                                    value={[printArea.y]}
                                    min={0} max={1} step={0.001}
                                    onValueChange={([val]) => setPrintArea(p => ({ ...p, y: val }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Width</Label>
                                    <Input
                                        type="number"
                                        value={printArea.width.toFixed(3)}
                                        onChange={(e) => setPrintArea(p => ({ ...p, width: parseFloat(e.target.value) || 0 }))}
                                        className="w-20 h-6 text-xs"
                                        step="0.001"
                                        min="0"
                                        max="1"
                                    />
                                </div>
                                <Slider
                                    value={[printArea.width]}
                                    min={0} max={1} step={0.001}
                                    onValueChange={([val]) => setPrintArea(p => ({ ...p, width: val }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Height</Label>
                                    <Input
                                        type="number"
                                        value={printArea.height.toFixed(3)}
                                        onChange={(e) => setPrintArea(p => ({ ...p, height: parseFloat(e.target.value) || 0 }))}
                                        className="w-20 h-6 text-xs"
                                        step="0.001"
                                        min="0"
                                        max="1"
                                    />
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
                                Debug Mockup Generation
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={async () => {
                                    if (!selectedVariantId) return;
                                    handleLog(`Inspecting templates for variant ${selectedVariantId}...`);
                                    try {
                                        const { inspectVariantTemplates } = await import('@/lib/actions/printful');
                                        const res = await inspectVariantTemplates(parseInt(selectedVariantId));
                                        handleLog('Template Inspection Result:');
                                        handleLog(`Product ID: ${res.productId}`);
                                        handleLog(`Product Name: ${res.productName}`);
                                        handleLog(`Found ${res.templates.length} templates:`);
                                        res.templates.forEach((t: any) => {
                                            handleLog(`- Placement: ${t.placement}`);
                                            handleLog(`  ID: ${t.template_id}`);
                                            handleLog(`  Size: ${t.print_area_width}x${t.print_area_height}`);
                                            handleLog(`  Image: ${t.image_url}`);
                                        });
                                    } catch (e: any) {
                                        handleLog(`Inspection Error: ${e.message}`);
                                    }
                                }}
                                disabled={!selectedVariantId}
                                className="w-full"
                            >
                                Inspect Available Templates
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

                            <Button
                                variant="outline"
                                onClick={() => analyzeTemplate(templateUrl, printArea)}
                                disabled={!templateUrl}
                                className="w-full"
                            >
                                Analyze Template
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (magentaBounds) {
                                        setPrintArea(magentaBounds);
                                        handleLog(`Copied detected magenta bounds to print area: ${JSON.stringify(magentaBounds)}`);
                                    }
                                }}
                                disabled={!magentaBounds}
                                className="w-full"
                            >
                                Use Detected Bounds as Print Area
                            </Button>

                            <Button
                                variant="outline"
                                onClick={async () => {
                                    if (!magentaBounds || !selectedVariantId) return;
                                    handleLog(`Updating database with detected bounds for variant ${selectedVariantId}...`);
                                    try {
                                        const { updateVariantPrintArea } = await import('@/lib/actions/printful');
                                        await updateVariantPrintArea(parseInt(selectedVariantId), magentaBounds);
                                        handleLog('Database updated successfully!');
                                    } catch (e: any) {
                                        handleLog(`Database update failed: ${e.message}`);
                                    }
                                }}
                                disabled={!magentaBounds || !selectedVariantId}
                                className="w-full"
                            >
                                Update Database with Detected Bounds
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
