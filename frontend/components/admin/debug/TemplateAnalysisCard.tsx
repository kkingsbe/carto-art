'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TemplateAnalysisCardProps {
    templateUrl: string;
    printArea: { x: number; y: number; width: number; height: number };
    magentaBounds: { x: number; y: number; width: number; height: number } | null;
    templateAnalysis: {
        templateDimensions: { width: number; height: number };
        detectedBounds: { x: number; y: number; width: number; height: number };
        printAreaPixels: { x: number; y: number; width: number; height: number };
    } | null;
}

export function TemplateAnalysisCard({
    templateUrl,
    printArea,
    magentaBounds,
    templateAnalysis
}: TemplateAnalysisCardProps) {
    if (!templateUrl) return null;

    return (
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
    );
}
