import type { PosterConfig, PosterStyle } from '@/types/poster';

/**
 * Manages layer visibility based on configuration and style toggles.
 * [SRP] Isolate visibility logic from style application.
 */
export class VisibilityManager {
    /**
     * Applies visibility settings to style layers.
     */
    public apply(
        styleLayers: any[],
        configLayers: PosterConfig['layers'],
        layerToggles: PosterStyle['layerToggles']
    ): void {
        styleLayers.forEach((layer) => {
            // Initialize layout if it doesn't exist
            if (!layer.layout) {
                layer.layout = {};
            }

            // Special handling for bathymetry/terrain under water
            if (layer.id.includes('bathymetry')) {
                this.handleBathymetryVisibility(layer, configLayers);
            }

            const toggle = layerToggles.find(t => t.layerIds.includes(layer.id));
            if (toggle) {
                this.handleToggleVisibility(layer, toggle, configLayers);
            } else if (!layer.id.includes('bathymetry')) {
                // For layers not in any toggle and not bathymetry, ensure visibility is set
                if (layer.layout.visibility === undefined) {
                    layer.layout.visibility = 'visible';
                }
            }
        });
    }

    private handleBathymetryVisibility(layer: any, configLayers: PosterConfig['layers']): void {
        const terrainUnderWaterEnabled = configLayers.terrainUnderWater ?? true;
        if (!terrainUnderWaterEnabled) {
            layer.layout.visibility = 'none';
        } else {
            layer.layout.visibility = 'visible';
        }
    }

    private handleToggleVisibility(
        layer: any,
        toggle: PosterStyle['layerToggles'][number],
        configLayers: PosterConfig['layers']
    ): void {
        const toggleValue = configLayers[toggle.id as keyof PosterConfig['layers']];
        const isVisible = Boolean(toggleValue);

        if (layer.id.includes('bathymetry')) {
            // For bathymetry layers, we already set visibility in handleBathymetryVisibility.
            // Only override if this is a different toggle (not terrainUnderWater) that's disabled.
            if (toggle.id !== 'terrainUnderWater' && !isVisible) {
                layer.layout.visibility = 'none';
            }
        } else {
            layer.layout.visibility = isVisible ? 'visible' : 'none';
        }
    }
}
