'use client';

import { ColorControls } from '@/components/controls/ColorControls';
import { LayerControls } from '@/components/controls/LayerControls';
import { CameraControls } from '@/components/controls/CameraControls';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { PosterConfig, ColorPalette } from '@/types/poster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CustomizePanelProps {
    config: PosterConfig;
    updateStyle: (style: any) => void;
    updatePalette: (palette: ColorPalette) => void;
    updateLayers: (layers: Partial<PosterConfig['layers']>) => void;
    updateRendering: (rendering: Partial<NonNullable<PosterConfig['rendering']>>) => void;
    setConfig: (config: PosterConfig) => void;
}

export function CustomizePanel({
    config,
    updatePalette,
    updateLayers,
    updateRendering,
    setConfig
}: CustomizePanelProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customize</h3>
            </div>

            <Tabs defaultValue="colors" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="colors">Colors</TabsTrigger>
                    <TabsTrigger value="details">Details & 3D</TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-6">
                    <ColorControls
                        palette={config.palette}
                        presets={config.style.palettes}
                        onPaletteChange={updatePalette}
                    />
                </TabsContent>

                <TabsContent value="details" className="space-y-8">
                    {/* Layers & Rendering */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Map Layers</h4>
                        <LayerControls
                            layers={config.layers}
                            rendering={config.rendering}
                            onLayersChange={updateLayers}
                            onRenderingChange={updateRendering}
                            availableToggles={config.style.layerToggles}
                            palette={config.palette}
                            is3DMode={config.is3DMode}
                            onToggle3DMode={(val) => setConfig({ ...config, is3DMode: val })}
                        />
                    </div>

                    {/* Advanced Camera */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Accordion type="single" collapsible>
                            <AccordionItem value="camera" className="border-none">
                                <AccordionTrigger className="py-2 hover:no-underline">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Advanced Camera</span>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pt-2">
                                        <CameraControls
                                            layers={config.layers}
                                            onLayersChange={updateLayers}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
