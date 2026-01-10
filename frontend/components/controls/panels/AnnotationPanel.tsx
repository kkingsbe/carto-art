'use client';

import { ContentSection } from '../typography/ContentSection';
import { TextPresets } from '../typography/TextPresets';
import { TypographySection } from '../typography/TypographySection';
import { BackdropSection } from '../typography/BackdropSection';
import { DisplayOptionsSection } from '../typography/DisplayOptionsSection';
import { MapLabelsSection } from '../typography/MapLabelsSection';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { MarkersList } from '../markers/MarkersList';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import type { PosterConfig, CustomMarker } from '@/types/poster';
import { trackEvent } from '@/lib/events';

interface AnnotationPanelProps {
    config: PosterConfig;
    updateTypography: (typography: Partial<PosterConfig['typography']>) => void;
    updateLocation: (location: Partial<PosterConfig['location']>) => void;
    updateLayers: (layers: Partial<PosterConfig['layers']>) => void;
    setConfig?: (config: PosterConfig) => void;
}

export function AnnotationPanel({
    config,
    updateTypography,
    updateLocation,
    updateLayers,
    setConfig
}: AnnotationPanelProps) {
    const { typography, style, layers, location, markers = [] } = config;
    const { subscriptionTier } = useUserSubscription();
    const isPlusEnabled = subscriptionTier === 'carto_plus';

    const handleMarkersUpdate = (newMarkers: CustomMarker[]) => {
        if (setConfig) {
            setConfig({ ...config, markers: newMarkers });
        }
    };

    const handleAddCenterMarker = () => {
        if (!isPlusEnabled || !setConfig) return;

        const newMarker: CustomMarker = {
            id: crypto.randomUUID(),
            lat: location.center[1], // Latitude
            lng: location.center[0], // Longitude
            type: 'pin',
            color: '#ef4444', // Tailwind red-500
            size: 30,
            label: 'New Marker'
        };

        setConfig({ ...config, markers: [...markers, newMarker] });

        // Track marker creation
        trackEvent({
            eventType: 'marker_add',
            eventName: 'custom_marker',
            metadata: {
                source: 'center_button'
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Annotation</h3>
            </div>

            {/* 1. Content Inputs - Most important */}
            <ContentSection
                location={location}
                onLocationChange={updateLocation}
            />

            {/* Custom Markers (Plus Feature) */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <Accordion type="single" collapsible>
                    <AccordionItem value="markers" className="border-none">
                        <AccordionTrigger className="py-2 hover:no-underline">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Custom Markers</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <MarkersList
                                markers={markers}
                                onMarkersChange={handleMarkersUpdate}
                                onCenterAdd={handleAddCenterMarker}
                                isPlusEnabled={isPlusEnabled}
                                connectMarkers={layers.connectMarkers}
                                markerPathColor={layers.markerPathColor}
                                showSegmentLengths={layers.showSegmentLengths}
                                fillMarkers={layers.fillMarkers}
                                markerFillColor={layers.markerFillColor}
                                markerPathLabelStyle={layers.markerPathLabelStyle}
                                markerPathLabelSize={layers.markerPathLabelSize}
                                onSettingsChange={(settings) => updateLayers(settings)}
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            {/* 2. Map Labels - Prominent */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Map Place Names</h4>
                {/* Reuse MapLabelsSection but maybe unwrap it later if needed. For now the accordion item style is baked in */}
                <div className="space-y-2">
                    {/* We can temporarily wrap in a simple div or reuse the Accordion structure if we want consistency */}
                    <Accordion type="single" collapsible defaultValue="map-labels">
                        <MapLabelsSection
                            layers={layers}
                            onLayersChange={updateLayers}
                        />
                    </Accordion>
                </div>
            </div>

            {/* 3. Typography Styles */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <TextPresets
                    typography={typography}
                    onTypographyChange={updateTypography}
                />

                <Accordion type="multiple" className="mt-4 space-y-2">
                    <TypographySection
                        typography={typography}
                        style={style}
                        onTypographyChange={updateTypography}
                    />
                    <BackdropSection
                        typography={typography}
                        onTypographyChange={updateTypography}
                    />
                    <DisplayOptionsSection
                        typography={typography}
                        onTypographyChange={updateTypography}
                    />
                </Accordion>
            </div>
        </div>
    );
}
