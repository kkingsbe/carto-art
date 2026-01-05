'use client';

import { PosterConfig, LayerToggle, ColorPalette } from '@/types/poster';
import { ControlSection, ControlCheckbox, CollapsibleSection, ControlSelect, ControlLabel, ControlSlider } from '@/components/ui/control-components';
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
  const dataLayers = availableToggles.filter(t =>
    ['streets', 'railroads', 'population', 'pois'].includes(t.id)
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
        {(geographicLayers.length > 0 || landcoverLayers.length > 0) && (
          <CollapsibleSection title="Geographic Features" defaultOpen={true}>
            <div className="space-y-2">
              {geographicLayers.map(renderLayerItem)}

              {/* Volumetric Terrain Controls */}
              <div id="volumetric-terrain-control" className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <ControlCheckbox
                  label="Volumetric 3D Terrain"
                  description="Render terrain height"
                  checked={Boolean(layers.volumetricTerrain)}
                  onChange={() => {
                    const newValue = !layers.volumetricTerrain;
                    onLayersChange({ volumetricTerrain: newValue });
                    trackEventAction({
                      eventType: 'layer_toggle',
                      eventName: 'volumetricTerrain',
                      metadata: { enabled: newValue }
                    });
                  }}
                />

                {layers.volumetricTerrain && (
                  <div className="mt-3 ml-6 space-y-4">
                    <div className="space-y-1.5">
                      <ControlLabel>Mesh Quality</ControlLabel>
                      <ControlSelect
                        value={layers.terrainMeshQuality ?? 'balanced'}
                        onChange={(e) => onLayersChange({ terrainMeshQuality: e.target.value as any })}
                      >
                        <option value="fast">Fast (Preview)</option>
                        <option value="balanced">Balanced</option>
                        <option value="high">High (Slower)</option>
                        <option value="export">Export Quality</option>
                      </ControlSelect>
                    </div>

                    <div className="space-y-1.5">
                      <ControlLabel>Exaggeration</ControlLabel>
                      <ControlSlider
                        min={0}
                        max={5}
                        step={0.1}
                        value={layers.volumetricTerrainExaggeration ?? 1.5}
                        onValueChange={(val) => onLayersChange({ volumetricTerrainExaggeration: val })}
                        displayValue={`${(layers.volumetricTerrainExaggeration ?? 1.5).toFixed(1)}x`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Landcover */}
              {landcoverLayers.length > 0 && (
                <CollapsibleSection title="Landcover" defaultOpen={true}>
                  <div className="space-y-2">
                    {landcoverLayers.map(renderLayerItem)}
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

