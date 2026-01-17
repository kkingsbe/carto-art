'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FrameMockupRenderer } from '@/components/ecommerce/FrameMockupRenderer';

interface PreviewComparisonProps {
    templateUrl: string;
    designUrl: string;
    printArea: { x: number; y: number; width: number; height: number };
    officialMockupUrl: string;
    onDebug: (message: string) => void;
    onDebugStages: (stages: { name: string; url: string; description?: string }[]) => void;
}

export function PreviewComparison({
    templateUrl,
    designUrl,
    printArea,
    officialMockupUrl,
    onDebug,
    onDebugStages
}: PreviewComparisonProps) {
    return (
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
                                    onDebug={onDebug}
                                    onDebugStages={onDebugStages}
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
    );
}
