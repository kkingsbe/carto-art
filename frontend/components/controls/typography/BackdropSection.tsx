'use client';

import { ControlSlider, ControlLabel } from '@/components/ui/control-components';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip-simple';
import { cn } from '@/lib/utils';
import type { PosterConfig } from '@/types/poster';

interface BackdropSectionProps {
    typography: PosterConfig['typography'];
    onTypographyChange: (typography: Partial<PosterConfig['typography']>) => void;
}

export function BackdropSection({ typography, onTypographyChange }: BackdropSectionProps) {
    return (
        <AccordionItem value="backdrop" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Backdrop & Readability</span>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 pt-2">
                    <div>
                        <ControlLabel className="mb-2">Backdrop Style</ControlLabel>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'none', name: 'None', demo: <div className="text-xs font-bold">Text</div> },
                                {
                                    id: 'subtle',
                                    name: 'Subtle Halo',
                                    demo: <div className="text-xs font-bold" style={{ textShadow: '0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.6)' }}>Text</div>
                                },
                                {
                                    id: 'strong',
                                    name: 'Strong Halo',
                                    demo: <div className="text-xs font-bold bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded">Text</div>
                                },
                                {
                                    id: 'gradient',
                                    name: 'Gradient',
                                    demo: (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/90 dark:from-gray-900/90 to-transparent rounded" />
                                            <div className="relative text-xs font-bold">Text</div>
                                        </div>
                                    )
                                },
                            ].map((backdropStyle) => (
                                <button
                                    key={backdropStyle.id}
                                    type="button"
                                    onClick={() => onTypographyChange({ textBackdrop: backdropStyle.id as any })}
                                    className={cn(
                                        'flex flex-col items-center gap-2 p-2.5 border rounded-lg transition-all',
                                        (typography.textBackdrop || 'subtle') === backdropStyle.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    )}
                                >
                                    <div className="w-full h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded flex items-center justify-center text-gray-900 dark:text-white">
                                        {backdropStyle.demo}
                                    </div>
                                    <span className="text-[10px] font-medium">{backdropStyle.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {typography.textBackdrop !== 'none' && (
                        <div className="space-y-4 pt-2">
                            <div>
                                <Tooltip content="Height of the backdrop overlay area as % of poster height.">
                                    <ControlLabel>
                                        Backdrop Height <Info className="inline w-3 h-3 ml-1 text-gray-400" />
                                    </ControlLabel>
                                </Tooltip>
                                <ControlSlider
                                    min="10"
                                    max="100"
                                    step="1"
                                    value={typography.backdropHeight ?? 35}
                                    onChange={(e) => onTypographyChange({ backdropHeight: parseInt(e.target.value) })}
                                    displayValue={`${typography.backdropHeight ?? 35}%`}
                                />
                            </div>

                            {typography.textBackdrop === 'gradient' && (
                                <div>
                                    <Tooltip content="0 = Soft fade, 100 = Abrupt transition">
                                        <ControlLabel>
                                            Gradient Sharpness <Info className="inline w-3 h-3 ml-1 text-gray-400" />
                                        </ControlLabel>
                                    </Tooltip>
                                    <ControlSlider
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={typography.backdropSharpness ?? 50}
                                        onChange={(e) => onTypographyChange({ backdropSharpness: parseInt(e.target.value) })}
                                        displayValue={typography.backdropSharpness === 0 ? 'Soft' : typography.backdropSharpness === 100 ? 'Abrupt' : `${typography.backdropSharpness}%`}
                                    />
                                </div>
                            )}

                            <div>
                                <ControlLabel>Backdrop Opacity</ControlLabel>
                                <ControlSlider
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={typography.backdropAlpha ?? 1.0}
                                    onChange={(e) => onTypographyChange({ backdropAlpha: parseFloat(e.target.value) })}
                                    displayValue={`${Math.round((typography.backdropAlpha ?? 1.0) * 100)}%`}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
