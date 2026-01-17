'use client';

import { useState, useEffect } from 'react';
import { getMarginAdjustedVariants, getImportedProductIds } from '@/lib/actions/ecommerce';
import { TemplateAnalysisCard } from '@/components/admin/debug/TemplateAnalysisCard';
import { ConfigurationPanel } from '@/components/admin/debug/ConfigurationPanel';
import { PreviewComparison } from '@/components/admin/debug/PreviewComparison';
import { ProcessingStagesCard } from '@/components/admin/debug/ProcessingStagesCard';
import { DebugConsole } from '@/components/admin/debug/DebugConsole';
import { ApiDebugInspector } from '@/components/admin/debug/ApiDebugInspector';

export default function AdminMockupPage() {
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

    // API Debug State
    const [uploadRequest, setUploadRequest] = useState<any>(null);
    const [uploadResponse, setUploadResponse] = useState<any>(null);
    const [mockupRequest, setMockupRequest] = useState<any>(null);
    const [mockupResponse, setMockupResponse] = useState<any>(null);
    const [designImageInfo, setDesignImageInfo] = useState<any>(null);
    const [copiedSection, setCopiedSection] = useState<string | null>(null);
    const [forceRotation, setForceRotation] = useState<boolean | null>(null);
    const [manualVariantId, setManualVariantId] = useState<string>('');

    const handleLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]} - ${message}`]);
    };

    const analyzeTemplate = async (templateUrl: string, printArea: any) => {
        if (!templateUrl) return;

        try {
            handleLog('Analyzing template for magenta bounds...');

            // Call server-side API to analyze the template
            const response = await fetch('/api/admin/debug/analyze-template', {
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

        // Clear previous debug data
        setUploadRequest(null);
        setUploadResponse(null);
        setMockupRequest(null);
        setMockupResponse(null);
        setDesignImageInfo(null);

        try {
            // Determine if we need to use a different variant ID based on orientation
            let effectiveVariantId = manualVariantId ? parseInt(manualVariantId) : parseInt(selectedVariantId);
            const selectedVariant = variants.find(v => v.id.toString() === selectedVariantId);
            
            if (selectedVariant) {
                // Load the design image to check its orientation
                const img = await loadImageFromUrl(designUrl);
                const designIsPortrait = img.height > img.width;
                const aspectRatio = img.width / img.height;
                
                // Store design image info for debug panel
                setDesignImageInfo({
                    width: img.width,
                    height: img.height,
                    orientation: designIsPortrait ? 'portrait' : 'landscape',
                    aspectRatio: aspectRatio.toFixed(3)
                });
                
                // Check the selected variant's print area orientation
                const printArea = selectedVariant.mockup_print_area
                    ? (typeof selectedVariant.mockup_print_area === 'string'
                        ? JSON.parse(selectedVariant.mockup_print_area)
                        : selectedVariant.mockup_print_area)
                    : null;
                
                if (printArea) {
                    const printAreaIsPortrait = printArea.height > printArea.width;
                    
                    handleLog(`Design orientation: ${designIsPortrait ? 'portrait' : 'landscape'} (${img.width}×${img.height})`);
                    handleLog(`Selected variant print area: ${printAreaIsPortrait ? 'portrait' : 'landscape'} (${printArea.width}×${printArea.height})`);
                    
                    // If orientations don't match, try to find a matching variant with swapped dimensions
                    if (designIsPortrait !== printAreaIsPortrait && !manualVariantId) {
                        handleLog('Orientation mismatch detected, searching for matching variant...');
                        
                        // Parse dimensions from variant name (e.g., "24×36" -> {width: 24, height: 36})
                        const parseDimensions = (name: string) => {
                            const match = name.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
                            return match ? { width: parseFloat(match[1]), height: parseFloat(match[2]) } : null;
                        };
                        
                        const selectedDims = parseDimensions(selectedVariant.name);
                        
                        if (selectedDims) {
                            // Look for a variant with swapped dimensions (e.g., 24×36 -> 36×24)
                            const targetWidth = selectedDims.height;
                            const targetHeight = selectedDims.width;
                            
                            const matchingVariant = variants.find(v => {
                                const dims = parseDimensions(v.name);
                                if (!dims) return false;
                                
                                // Check if dimensions match (with small tolerance for floating point)
                                const widthMatch = Math.abs(dims.width - targetWidth) < 0.1;
                                const heightMatch = Math.abs(dims.height - targetHeight) < 0.1;
                                
                                // Also check that it's the same product
                                const sameProduct = v.product_id === selectedVariant.product_id;
                                
                                return widthMatch && heightMatch && sameProduct;
                            });
                            
                            if (matchingVariant) {
                                effectiveVariantId = matchingVariant.id;
                                handleLog(`Found matching variant: ${matchingVariant.name} (ID: ${effectiveVariantId})`);
                                handleLog(`Switching from ${selectedVariant.name} to ${matchingVariant.name} for correct orientation`);
                            } else {
                                handleLog(`No matching variant found with swapped dimensions, using original variant`);
                            }
                        }
                    } else {
                        handleLog('Orientations match, using selected variant');
                    }
                }
            }
            
            // First, upload the design with rotation if needed
            handleLog('Uploading design to Printful (with rotation if needed)...');
            const uploadRequestBody = {
                url: designUrl,
                variant_id: effectiveVariantId,
                ...(forceRotation !== null && { force_rotation: forceRotation })
            };
            setUploadRequest(uploadRequestBody);
            
            const uploadRes = await fetch('/api/printful/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(uploadRequestBody)
            });

            if (!uploadRes.ok) {
                throw new Error('Failed to upload design');
            }

            const uploadData = await uploadRes.json();
            setUploadResponse(uploadData);
            handleLog(`Design uploaded (rotated: ${uploadData.rotated}), file ID: ${uploadData.id}`);
            
            // Use the rotated image URL if available, otherwise fall back to preview_url or original
            const imageUrlForMockup = uploadData.image_url || uploadData.preview_url || designUrl;
            handleLog(`Using image URL for mockup: ${imageUrlForMockup.substring(0, 80)}...`);

            // Then generate mockup with the uploaded file using the effective variant ID
            handleLog(`Generating mockup with variant ID: ${effectiveVariantId}`);
            const mockupRequestBody = {
                variant_id: effectiveVariantId,
                image_url: imageUrlForMockup
            };
            setMockupRequest(mockupRequestBody);
            
            const res = await fetch('/api/printful/mockup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockupRequestBody)
            });

            const data = await res.json();
            setMockupResponse(data);

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

    // Helper function to load an image and get its dimensions
    const loadImageFromUrl = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = url;
        });
    };

    const copyToClipboard = async (text: string, section: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedSection(section);
            setTimeout(() => setCopiedSection(null), 2000);
        } catch (err) {
            handleLog('Failed to copy to clipboard');
        }
    };

    const selectedVariant = variants.find(v => v.id.toString() === selectedVariantId);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Mockup Renderer Laboratory</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Debug and test mockup generation with real-time analysis.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Template Analysis */}
                <TemplateAnalysisCard
                    templateUrl={templateUrl}
                    printArea={printArea}
                    magentaBounds={magentaBounds}
                    templateAnalysis={templateAnalysis}
                />

                {/* Controls */}
                <ConfigurationPanel
                    variants={variants}
                    selectedVariantId={selectedVariantId}
                    templateUrl={templateUrl}
                    designUrl={designUrl}
                    printArea={printArea}
                    isGenerating={isGenerating}
                    onVariantChange={handleVariantChange}
                    onTemplateUrlChange={setTemplateUrl}
                    onDesignUrlChange={setDesignUrl}
                    onPrintAreaChange={setPrintArea}
                    onGenerateOfficial={handleGenerateOfficial}
                    onDebugMockup={async () => {
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
                    onInspectTemplates={async () => {
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
                    onRegenerateTemplate={async () => {
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
                    onAnalyzeTemplate={() => analyzeTemplate(templateUrl, printArea)}
                    onUseDetectedBounds={() => {
                        if (magentaBounds) {
                            setPrintArea(magentaBounds);
                            handleLog(`Copied detected magenta bounds to print area: ${JSON.stringify(magentaBounds)}`);
                        }
                    }}
                    onUpdateDatabase={async () => {
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
                    onClearLogs={clearLogs}
                    magentaBounds={magentaBounds}
                />

                {/* Preview */}
                <PreviewComparison
                    templateUrl={templateUrl}
                    designUrl={designUrl}
                    printArea={printArea}
                    officialMockupUrl={officialMockupUrl}
                    onDebug={handleLog}
                    onDebugStages={setDebugStages}
                />

                {/* Debug Stages */}
                <ProcessingStagesCard debugStages={debugStages} />
            </div>

            {/* Logs Console */}
            <DebugConsole logs={logs} onClear={clearLogs} />

            {/* API Debug Panel */}
            <ApiDebugInspector
                selectedVariant={selectedVariant}
                printArea={printArea}
                templateAnalysis={templateAnalysis}
                designImageInfo={designImageInfo}
                uploadRequest={uploadRequest}
                uploadResponse={uploadResponse}
                mockupRequest={mockupRequest}
                mockupResponse={mockupResponse}
                forceRotation={forceRotation}
                manualVariantId={manualVariantId}
                onForceRotationChange={setForceRotation}
                onManualVariantIdChange={setManualVariantId}
                onResetOverrides={() => {
                    setForceRotation(null);
                    setManualVariantId('');
                    handleLog('Reset manual overrides');
                }}
                onCopyToClipboard={copyToClipboard}
                copiedSection={copiedSection}
            />
        </div>
    );
}
