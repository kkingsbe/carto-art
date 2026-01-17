'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Copy, Check } from 'lucide-react';

interface ApiDebugInspectorProps {
    selectedVariant: any;
    printArea: { x: number; y: number; width: number; height: number };
    templateAnalysis: {
        templateDimensions: { width: number; height: number };
        detectedBounds: { x: number; y: number; width: number; height: number };
        printAreaPixels: { x: number; y: number; width: number; height: number };
    } | null;
    designImageInfo: any;
    uploadRequest: any;
    uploadResponse: any;
    mockupRequest: any;
    mockupResponse: any;
    forceRotation: boolean | null;
    manualVariantId: string;
    onForceRotationChange: (value: boolean | null) => void;
    onManualVariantIdChange: (value: string) => void;
    onResetOverrides: () => void;
    onCopyToClipboard: (text: string, section: string) => void;
    copiedSection: string | null;
}

export function ApiDebugInspector({
    selectedVariant,
    printArea,
    templateAnalysis,
    designImageInfo,
    uploadRequest,
    uploadResponse,
    mockupRequest,
    mockupResponse,
    forceRotation,
    manualVariantId,
    onForceRotationChange,
    onManualVariantIdChange,
    onResetOverrides,
    onCopyToClipboard,
    copiedSection
}: ApiDebugInspectorProps) {
    return (
        <Card className="border-orange-500 border-2 bg-orange-50/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    🔍 API Debug Inspector
                    <span className="text-sm font-normal text-muted-foreground">
                        (Real-time API request/response data)
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Manual Override Controls */}
                <div className="bg-white p-4 rounded-lg border space-y-3">
                    <h3 className="font-semibold text-sm">Manual Override Controls</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Force Rotation</Label>
                            <Select
                                value={forceRotation === null ? 'auto' : forceRotation ? 'true' : 'false'}
                                onValueChange={(val) => onForceRotationChange(val === 'auto' ? null : val === 'true')}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Auto (default)</SelectItem>
                                    <SelectItem value="true">Force ON</SelectItem>
                                    <SelectItem value="false">Force OFF</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Manual Variant ID Override</Label>
                            <Input
                                type="number"
                                placeholder="Leave empty for auto"
                                value={manualVariantId}
                                onChange={(e) => onManualVariantIdChange(e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onResetOverrides}
                                className="h-8 text-xs"
                            >
                                Reset Overrides
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Variant Information */}
                {selectedVariant && (
                    <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex items-center justify-between w-full bg-white p-3 rounded-lg border hover:bg-gray-50">
                            <h3 className="font-semibold text-sm">📦 Selected Variant Information</h3>
                            <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 bg-white p-4 rounded-lg border space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Variant ID:</span> {selectedVariant.id}
                                </div>
                                <div>
                                    <span className="font-medium">Product ID:</span> {selectedVariant.product_id}
                                </div>
                                <div className="col-span-2">
                                    <span className="font-medium">Name:</span> {selectedVariant.name}
                                </div>
                                <div className="col-span-2">
                                    <span className="font-medium">Template URL:</span>
                                    <div className="text-xs text-blue-600 break-all mt-1">
                                        {selectedVariant.mockup_template_url || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            
                            {selectedVariant.mockup_print_area && (
                                <div className="border-t pt-3 mt-3">
                                    <h4 className="font-medium text-sm mb-2">Print Area Details</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="font-medium">X (%):</span> {(printArea.x * 100).toFixed(1)}%
                                        </div>
                                        <div>
                                            <span className="font-medium">Y (%):</span> {(printArea.y * 100).toFixed(1)}%
                                        </div>
                                        <div>
                                            <span className="font-medium">Width (%):</span> {(printArea.width * 100).toFixed(1)}%
                                        </div>
                                        <div>
                                            <span className="font-medium">Height (%):</span> {(printArea.height * 100).toFixed(1)}%
                                        </div>
                                        {templateAnalysis && (
                                            <>
                                                <div>
                                                    <span className="font-medium">Width (px):</span> {templateAnalysis.printAreaPixels.width.toFixed(0)}px
                                                </div>
                                                <div>
                                                    <span className="font-medium">Height (px):</span> {templateAnalysis.printAreaPixels.height.toFixed(0)}px
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="font-medium">Orientation:</span>{' '}
                                                    <span className={printArea.height > printArea.width ? 'text-blue-600 font-semibold' : 'text-green-600 font-semibold'}>
                                                        {printArea.height > printArea.width ? 'Portrait' : 'Landscape'}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Design Image Analysis */}
                {designImageInfo && (
                    <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex items-center justify-between w-full bg-white p-3 rounded-lg border hover:bg-gray-50">
                            <h3 className="font-semibold text-sm">🖼️ Design Image Analysis</h3>
                            <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 bg-white p-4 rounded-lg border">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Width:</span> {designImageInfo.width}px
                                </div>
                                <div>
                                    <span className="font-medium">Height:</span> {designImageInfo.height}px
                                </div>
                                <div>
                                    <span className="font-medium">Orientation:</span>{' '}
                                    <span className={designImageInfo.orientation === 'portrait' ? 'text-blue-600 font-semibold' : 'text-green-600 font-semibold'}>
                                        {designImageInfo.orientation}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium">Aspect Ratio:</span> {designImageInfo.aspectRatio}
                                </div>
                                <div className="col-span-2">
                                    <span className="font-medium">Dimensions:</span> {designImageInfo.width} × {designImageInfo.height}
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Upload API Request */}
                {uploadRequest && (
                    <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex items-center justify-between w-full bg-white p-3 rounded-lg border hover:bg-gray-50">
                            <h3 className="font-semibold text-sm">📤 Upload API Request</h3>
                            <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 bg-white p-4 rounded-lg border">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-muted-foreground">POST /api/printful/upload</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onCopyToClipboard(JSON.stringify(uploadRequest, null, 2), 'uploadReq')}
                                    className="h-6 px-2"
                                >
                                    {copiedSection === 'uploadReq' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </Button>
                            </div>
                            <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                                {JSON.stringify(uploadRequest, null, 2)}
                            </pre>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Upload API Response */}
                {uploadResponse && (
                    <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex items-center justify-between w-full bg-white p-3 rounded-lg border hover:bg-gray-50">
                            <h3 className="font-semibold text-sm">📥 Upload API Response</h3>
                            <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 bg-white p-4 rounded-lg border">
                            <div className="flex justify-between items-center mb-2">
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Response from /api/printful/upload</div>
                                    {uploadResponse.rotated !== undefined && (
                                        <div className="text-xs">
                                            <span className="font-medium">Rotation Applied:</span>{' '}
                                            <span className={uploadResponse.rotated ? 'text-orange-600 font-semibold' : 'text-green-600'}>
                                                {uploadResponse.rotated ? 'YES' : 'NO'}
                                            </span>
                                        </div>
                                    )}
                                    {uploadResponse.id && (
                                        <div className="text-xs">
                                            <span className="font-medium">File ID:</span> {uploadResponse.id}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onCopyToClipboard(JSON.stringify(uploadResponse, null, 2), 'uploadRes')}
                                    className="h-6 px-2"
                                >
                                    {copiedSection === 'uploadRes' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </Button>
                            </div>
                            <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                                {JSON.stringify(uploadResponse, null, 2)}
                            </pre>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Mockup API Request */}
                {mockupRequest && (
                    <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex items-center justify-between w-full bg-white p-3 rounded-lg border hover:bg-gray-50">
                            <h3 className="font-semibold text-sm">📤 Mockup Generation API Request</h3>
                            <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 bg-white p-4 rounded-lg border">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-muted-foreground">POST /api/printful/mockup</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onCopyToClipboard(JSON.stringify(mockupRequest, null, 2), 'mockupReq')}
                                    className="h-6 px-2"
                                >
                                    {copiedSection === 'mockupReq' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </Button>
                            </div>
                            <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                                {JSON.stringify(mockupRequest, null, 2)}
                            </pre>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Mockup API Response */}
                {mockupResponse && (
                    <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex items-center justify-between w-full bg-white p-3 rounded-lg border hover:bg-gray-50">
                            <h3 className="font-semibold text-sm">📥 Mockup Generation API Response</h3>
                            <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 bg-white p-4 rounded-lg border">
                            <div className="flex justify-between items-center mb-2">
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Response from /api/printful/mockup</div>
                                    {mockupResponse.mockup_url && (
                                        <div className="text-xs">
                                            <span className="font-medium">Mockup URL:</span>{' '}
                                            <a href={mockupResponse.mockup_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                View
                                            </a>
                                        </div>
                                    )}
                                    {mockupResponse.task_key && (
                                        <div className="text-xs">
                                            <span className="font-medium">Task Key:</span> {mockupResponse.task_key}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onCopyToClipboard(JSON.stringify(mockupResponse, null, 2), 'mockupRes')}
                                    className="h-6 px-2"
                                >
                                    {copiedSection === 'mockupRes' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </Button>
                            </div>
                            <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                                {JSON.stringify(mockupResponse, null, 2)}
                            </pre>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {!uploadRequest && !mockupRequest && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Generate an official mockup to see API request/response data here.</p>
                        <p className="text-sm mt-2">This panel will update in real-time as API calls are made.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
