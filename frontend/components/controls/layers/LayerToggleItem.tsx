'use client';

import { ControlCheckbox } from '@/components/ui/control-components';
import { StreetsControls } from './StreetsControls';
import { TerrainControls } from './TerrainControls';
import { ContoursControls } from './ContoursControls';
import { Buildings3DControls } from './Buildings3DControls';
import { LayerToggle, PosterConfig } from '@/types/poster';

interface LayerToggleItemProps {
    item: LayerToggle;
    layers: PosterConfig['layers'];
    onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
    showUnderwaterToggle?: boolean;
}

export function LayerToggleItem({ item, layers, onLayersChange, showUnderwaterToggle }: LayerToggleItemProps) {
    const isEnabled = Boolean(layers[item.id as keyof PosterConfig['layers']]);

    const toggleLayer = () => {
        onLayersChange({ [item.id]: !isEnabled });
    };

    return (
        <div className="space-y-2">
            <ControlCheckbox
                label={item.name}
                checked={isEnabled}
                onChange={toggleLayer}
            />

            {isEnabled && item.id === 'streets' && (
                <StreetsControls layers={layers} onLayersChange={onLayersChange} />
            )}

            {isEnabled && item.id === 'terrain' && (
                <TerrainControls
                    layers={layers}
                    onLayersChange={onLayersChange}
                    showUnderwaterToggle={showUnderwaterToggle}
                />
            )}

            {isEnabled && item.id === 'contours' && (
                <ContoursControls layers={layers} onLayersChange={onLayersChange} />
            )}

            {isEnabled && item.id === 'buildings3D' && (
                <Buildings3DControls layers={layers} onLayersChange={onLayersChange} />
            )}
        </div>
    );
}
