'use client';

import { PosterConfig, LayerToggle, ColorPalette } from '@/types/poster';
import { ControlSection, ControlCheckbox, CollapsibleSection } from '@/components/ui/control-components';
import { MarkerControls } from './layers/MarkerControls';
import { RenderingControls } from './layers/RenderingControls';
import { LayerToggleItem } from './layers/LayerToggleItem';
import { trackEventAction } from '@/lib/actions/events';

interface LayerControlsProps {
  layers: PosterConfig['layers'];
  rendering?: PosterConfig['rendering'];
  onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
  onRenderingChange?: (rendering: Partial<NonNullable<PosterConfig['rendering']>>) => void;
  availableToggles: LayerToggle[];
  palette: ColorPalette;
}

export function LayerControls({ layers, rendering, onLayersChange, onRenderingChange, availableToggles, palette }: LayerControlsProps) {

  const toggleLayer = (key: keyof PosterConfig['layers']) => {
    const newValue = !layers[key];
    onLayersChange({ [key]: newValue });

    trackEventAction({
      eventType: 'layer_toggle',
      eventName: key,
      metadata: { enabled: newValue }
    });
  };

  const isTerrainUnderWaterToggleVisible = availableToggles.some(t => t.id === 'terrainUnderWater');

  // Categorize layers
  const geographicLayers = availableToggles.filter(t =>
    ['terrain', 'water', 'parks', 'buildings', 'buildings3D', 'terrainUnderWater', 'contours', 'boundaries'].includes(t.id)
  );
  const landcoverLayers = availableToggles.filter(t =>
    ['landcoverWood', 'landcoverGrass', 'landcoverFarmland', 'landcoverIce'].includes(t.id)
  );
  const landuseLayers = availableToggles.filter(t =>
    ['landuseForest', 'landuseOrchard', 'landuseVineyard', 'landuseCemetery', 'landuseGrass'].includes(t.id)
  );
  const dataLayers = availableToggles.filter(t =>
    ['streets', 'population', 'pois'].includes(t.id)
  );

  const renderLayerItem = (item: LayerToggle) => {
    return (
      <LayerToggleItem
        key={item.id}
        item={item}
        layers={layers}
        onLayersChange={onLayersChange}
        showUnderwaterToggle={isTerrainUnderWaterToggleVisible}
      />
    );
  };

  return (
    <div className="space-y-6">
      <ControlSection title="Visible Layers">
        {/* Location Marker - First */}
        <div className="space-y-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <ControlCheckbox
            label="Location Marker"
            checked={Boolean(layers.marker)}
            onChange={() => toggleLayer('marker')}
          />

          {layers.marker && (
            <MarkerControls layers={layers} palette={palette} onLayersChange={onLayersChange} />
          )}
        </div>

        {/* Geographic Features */}
        {(geographicLayers.length > 0 || landcoverLayers.length > 0 || landuseLayers.length > 0) && (
          <CollapsibleSection title="Geographic Features" defaultOpen={true}>
            <div className="space-y-2">
              {geographicLayers.map(renderLayerItem)}

              {/* Landcover */}
              {landcoverLayers.length > 0 && (
                <CollapsibleSection title="Landcover" defaultOpen={true}>
                  <div className="space-y-2">
                    {landcoverLayers.map(renderLayerItem)}
                  </div>
                </CollapsibleSection>
              )}

              {/* Landuse */}
              {landuseLayers.length > 0 && (
                <CollapsibleSection title="Landuse" defaultOpen={true}>
                  <div className="space-y-2">
                    {landuseLayers.map(renderLayerItem)}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Data Layers */}
        {dataLayers.length > 0 && (
          <CollapsibleSection title="Data Layers" defaultOpen={true}>
            <div className="space-y-2">
              {dataLayers.map(renderLayerItem)}
            </div>
          </CollapsibleSection>
        )}
      </ControlSection>

      {/* Rendering Quality Section */}
      <RenderingControls rendering={rendering} onRenderingChange={onRenderingChange} />
    </div>
  );
}

