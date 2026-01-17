'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ConfigurationPanelProps {
    variants: any[];
    selectedVariantId: string;
    templateUrl: string;
    designUrl: string;
    printArea: { x: number; y: number; width: number; height: number };
    isGenerating: boolean;
    onVariantChange: (id: string) => void;
    onTemplateUrlChange: (url: string) => void;
    onDesignUrlChange: (url: string) => void;
    onPrintAreaChange: (area: { x: number; y: number; width: number; height: number }) => void;
    onGenerateOfficial: () => void;
    onDebugMockup: () => void;
    onInspectTemplates: () => void;
    onRegenerateTemplate: () => void;
    onAnalyzeTemplate: () => void;
    onUseDetectedBounds: () => void;
    onUpdateDatabase: () => void;
    onClearLogs: () => void;
    magentaBounds: { x: number; y: number; width: number; height: number } | null;
}

export function ConfigurationPanel({
    variants,
    selectedVariantId,
    templateUrl,
    designUrl,
    printArea,
    isGenerating,
    onVariantChange,
    onTemplateUrlChange,
    onDesignUrlChange,
    onPrintAreaChange,
    onGenerateOfficial,
    onDebugMockup,
    onInspectTemplates,
    onRegenerateTemplate,
    onAnalyzeTemplate,
    onUseDetectedBounds,
    onUpdateDatabase,
    onClearLogs,
    magentaBounds
}: ConfigurationPanelProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Select Product Variant</Label>
                    <Select value={selectedVariantId} onValueChange={onVariantChange}>
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
                        onChange={(e) => onTemplateUrlChange(e.target.value)}
                        placeholder="https://..."
                    />
                </div>

                <div className="space-y-2">
                    <Label>Design URL</Label>
                    <Input
                        value={designUrl}
                        onChange={(e) => onDesignUrlChange(e.target.value)}
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
                                onChange={(e) => onPrintAreaChange({ ...printArea, x: parseFloat(e.target.value) || 0 })}
                                className="w-20 h-6 text-xs"
                                step="0.001"
                                min="0"
                                max="1"
                            />
                        </div>
                        <Slider
                            value={[printArea.x]}
                            min={0} max={1} step={0.001}
                            onValueChange={([val]) => onPrintAreaChange({ ...printArea, x: val })}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Y</Label>
                            <Input
                                type="number"
                                value={printArea.y.toFixed(3)}
                                onChange={(e) => onPrintAreaChange({ ...printArea, y: parseFloat(e.target.value) || 0 })}
                                className="w-20 h-6 text-xs"
                                step="0.001"
                                min="0"
                                max="1"
                            />
                        </div>
                        <Slider
                            value={[printArea.y]}
                            min={0} max={1} step={0.001}
                            onValueChange={([val]) => onPrintAreaChange({ ...printArea, y: val })}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Width</Label>
                            <Input
                                type="number"
                                value={printArea.width.toFixed(3)}
                                onChange={(e) => onPrintAreaChange({ ...printArea, width: parseFloat(e.target.value) || 0 })}
                                className="w-20 h-6 text-xs"
                                step="0.001"
                                min="0"
                                max="1"
                            />
                        </div>
                        <Slider
                            value={[printArea.width]}
                            min={0} max={1} step={0.001}
                            onValueChange={([val]) => onPrintAreaChange({ ...printArea, width: val })}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Height</Label>
                            <Input
                                type="number"
                                value={printArea.height.toFixed(3)}
                                onChange={(e) => onPrintAreaChange({ ...printArea, height: parseFloat(e.target.value) || 0 })}
                                className="w-20 h-6 text-xs"
                                step="0.001"
                                min="0"
                                max="1"
                            />
                        </div>
                        <Slider
                            value={[printArea.height]}
                            min={0} max={1} step={0.001}
                            onValueChange={([val]) => onPrintAreaChange({ ...printArea, height: val })}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Button
                        onClick={onGenerateOfficial}
                        disabled={isGenerating || !selectedVariantId || !designUrl}
                        className="w-full"
                    >
                        {isGenerating ? 'Generating Official Preview...' : 'Generate Official Preview'}
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={onDebugMockup}
                        disabled={!selectedVariantId}
                        className="w-full"
                    >
                        Debug Mockup Generation
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={onInspectTemplates}
                        disabled={!selectedVariantId}
                        className="w-full"
                    >
                        Inspect Available Templates
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={onRegenerateTemplate}
                        disabled={!selectedVariantId}
                        className="w-full"
                    >
                        Regenerate Template Data
                    </Button>

                    <Button
                        variant="outline"
                        onClick={onAnalyzeTemplate}
                        disabled={!templateUrl}
                        className="w-full"
                    >
                        Analyze Template
                    </Button>

                    <Button
                        variant="outline"
                        onClick={onUseDetectedBounds}
                        disabled={!magentaBounds}
                        className="w-full"
                    >
                        Use Detected Bounds as Print Area
                    </Button>

                    <Button
                        variant="outline"
                        onClick={onUpdateDatabase}
                        disabled={!magentaBounds || !selectedVariantId}
                        className="w-full"
                    >
                        Update Database with Detected Bounds
                    </Button>

                    <Button variant="outline" onClick={onClearLogs} className="w-full">Clear Logs</Button>
                </div>
            </CardContent>
        </Card>
    );
}
