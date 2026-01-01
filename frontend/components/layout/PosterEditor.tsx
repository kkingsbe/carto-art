'use client';

import { useMemo, useCallback, useState } from 'react';
import { usePosterConfig } from '@/hooks/usePosterConfig';
import { useSavedProjects } from '@/hooks/useSavedProjects';
import { useMapExport } from '@/hooks/useMapExport';
import { Maximize, Plus, Minus } from 'lucide-react';
import { MapPreview } from '@/components/map/MapPreview';
import { TextOverlay } from '@/components/map/TextOverlay';
import { ExportButton } from '@/components/controls/ExportButton';
import { applyPaletteToStyle } from '@/lib/styles/applyPalette';
import { throttle, cn } from '@/lib/utils';
import { getNumericRatio, getAspectRatioCSS } from '@/lib/styles/dimensions';
import { TabNavigation, type Tab } from './TabNavigation';
import { ControlDrawer } from './ControlDrawer';
import type MapLibreGL from 'maplibre-gl';

export function PosterEditor() {
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  const { 
    config, 
    updateLocation, 
    updateStyle, 
    updatePalette, 
    updateTypography,
    updateFormat,
    updateLayers,
    setConfig,
  } = usePosterConfig();
  
  const { 
    projects, 
    saveProject, 
    deleteProject, 
    renameProject 
  } = useSavedProjects();

  const { isExporting, exportToPNG, setMapRef, fitToLocation, zoomIn, zoomOut } = useMapExport(config);

  const numericRatio = useMemo(() => {
    return getNumericRatio(config.format.aspectRatio, config.format.orientation);
  }, [config.format.aspectRatio, config.format.orientation]);

  // Apply palette colors and visibility to the current map style
  const mapStyle = useMemo(() => {
    return applyPaletteToStyle(
      config.style.mapStyle, 
      config.palette, 
      config.layers, 
      config.style.layerToggles
    );
  }, [config.style.mapStyle, config.palette, config.layers, config.style.layerToggles]);

  const handleMapLoad = (map: MapLibreGL.Map) => {
    setMapRef(map);
  };

  // Throttle the location update to prevent excessive style re-renders
  const throttledUpdateLocation = useMemo(
    () => throttle((center: [number, number], zoom: number) => {
      updateLocation({ center, zoom });
    }, 60),
    [updateLocation]
  );

  const handleMapMove = useCallback((center: [number, number], zoom: number) => {
    throttledUpdateLocation(center, zoom);
  }, [throttledUpdateLocation]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg" />
          <span className="font-bold text-gray-900 dark:text-white">CartoArt</span>
        </div>
        <ExportButton onExport={exportToPNG} isExporting={isExporting} />
      </div>

      <TabNavigation 
        activeTab={activeTab}
        isDrawerOpen={isDrawerOpen}
        onTabChange={setActiveTab}
        onToggleDrawer={setIsDrawerOpen}
      />

      <ControlDrawer 
        activeTab={activeTab}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        config={config}
        updateLocation={updateLocation}
        updateStyle={updateStyle}
        updatePalette={updatePalette}
        updateTypography={updateTypography}
        updateFormat={updateFormat}
        updateLayers={updateLayers}
        setConfig={setConfig}
        savedProjects={projects}
        saveProject={saveProject}
        deleteProject={deleteProject}
        renameProject={renameProject}
      />

      {/* Main Content */}
      <main 
        className="flex-1 relative bg-gray-100 dark:bg-gray-950 bg-grid-pattern flex flex-col overflow-hidden pb-16 md:pb-0"
        style={{ containerType: 'size' }}
      >
        {/* Top Actions Overlay - Desktop Only */}
        <div className="absolute top-6 right-8 z-50 pointer-events-auto hidden md:block">
          <ExportButton onExport={exportToPNG} isExporting={isExporting} />
        </div>

        {/* Map Canvas */}
        <div className="flex-1 relative flex items-center justify-center p-4 md:p-8">
          <div 
            className="relative shadow-2xl bg-white flex flex-col transition-all duration-300 ease-in-out ring-1 ring-black/5"
            style={{ 
              aspectRatio: getAspectRatioCSS(config.format.aspectRatio, config.format.orientation),
              backgroundColor: config.palette.background,
              width: `min(calc(100% - 2rem), calc((100cqh - 2rem) * ${numericRatio}))`,
              height: 'auto',
              maxHeight: 'calc(100cqh - 2rem)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              containerType: 'size',
            }}
          >
            {/* The Map Window */}
            <div 
              className="absolute overflow-hidden min-h-0 min-w-0"
              style={{
                top: `${config.format.margin}cqw`,
                left: `${config.format.margin}cqw`,
                right: `${config.format.margin}cqw`,
                bottom: `${config.format.margin}cqw`,
                borderRadius: (config.format.maskShape || 'rectangular') === 'circular' ? '50%' : '0',
              }}
            >
              <MapPreview
                mapStyle={mapStyle}
                location={config.location}
                format={config.format}
                showMarker={config.layers.marker}
                markerColor={config.layers.markerColor || config.palette.primary || config.palette.accent || config.palette.text}
                onMapLoad={handleMapLoad}
                onMove={handleMapMove}
                layers={config.layers}
                layerToggles={config.style.layerToggles}
              />
              
              {/* Floating Map Controls */}
              <div className="absolute bottom-4 right-4 flex flex-row gap-2 z-10">
                <button
                  onClick={zoomOut}
                  className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-md shadow-sm transition-colors text-gray-600 hover:text-blue-600 pointer-events-auto"
                  title="Zoom Out"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={zoomIn}
                  className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-md shadow-sm transition-colors text-gray-600 hover:text-blue-600 pointer-events-auto"
                  title="Zoom In"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={fitToLocation}
                  className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-md shadow-sm transition-colors text-gray-600 hover:text-blue-600 pointer-events-auto"
                  title="Snap map to original bounds"
                >
                  <Maximize className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Text Overlay */}
            <TextOverlay config={config} />

            {/* Border Overlay - Now drawn AFTER TextOverlay to stay on top of gradients */}
            {config.format.borderStyle !== 'none' && (
              <div 
                className="absolute pointer-events-none z-30"
                style={{
                  top: `${config.format.margin}cqw`,
                  left: `${config.format.margin}cqw`,
                  right: `${config.format.margin}cqw`,
                  bottom: `${config.format.margin}cqw`,
                  padding: config.format.borderStyle === 'inset' ? '2cqw' : '0',
                }}
              >
                <div 
                  className="w-full h-full"
                  style={{
                    border: `${
                      config.format.borderStyle === 'thick' ? '1.5cqw' : '0.5cqw'
                    } solid ${config.palette.accent || config.palette.text}`,
                    borderRadius: (config.format.maskShape || 'rectangular') === 'circular' ? '50%' : '0',
                  }}
                />
                
                {/* Compass Rose Preview (SVG) */}
                {(config.format.maskShape || 'rectangular') === 'circular' && config.format.compassRose && (
                  <svg 
                    className="absolute inset-0 w-full h-full"
                    style={{ pointerEvents: 'none' }}
                    viewBox="0 0 100 100"
                  >
                    <g
                      stroke={config.palette.accent || config.palette.text}
                      fill={config.palette.accent || config.palette.text}
                      strokeWidth="0.15"
                      opacity="0.8"
                    >
                      {/* Draw 8 main directions */}
                      {[
                        { angle: 0, label: 'N' },
                        { angle: 45, label: 'NE' },
                        { angle: 90, label: 'E' },
                        { angle: 135, label: 'SE' },
                        { angle: 180, label: 'S' },
                        { angle: 225, label: 'SW' },
                        { angle: 270, label: 'W' },
                        { angle: 315, label: 'NW' },
                      ].map(({ angle, label }) => {
                        const rad = ((angle - 90) * Math.PI) / 180;
                        const centerX = 50;
                        const centerY = 50;
                        // The border div extends nearly to the edges of the viewBox
                        // Account for border width - border can be 0.5cqw to 1.5cqw, which in viewBox terms is roughly 0.5-1.5
                        const borderOuterRadius = 49; // Close to edge of 100x100 viewBox, accounting for border
                        const spacing = 3; // Spacing between border and compass elements
                        const compassRadius = borderOuterRadius + spacing; // Position ticks outside border
                        const tickLen = label === 'N' || label === 'S' || label === 'E' || label === 'W' ? 3 : 1.5;
                        
                        const x1 = centerX + Math.cos(rad) * compassRadius;
                        const y1 = centerY + Math.sin(rad) * compassRadius;
                        const x2 = centerX + Math.cos(rad) * (compassRadius - tickLen);
                        const y2 = centerY + Math.sin(rad) * (compassRadius - tickLen);
                        
                        // Position labels further out from the ticks
                        const labelRadius = compassRadius + 3;
                        const labelX = centerX + Math.cos(rad) * labelRadius;
                        const labelY = centerY + Math.sin(rad) * labelRadius;
                        
                        return (
                          <g key={angle}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} />
                            <text
                              x={labelX}
                              y={labelY}
                              fontSize="2"
                              fontWeight="bold"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              opacity={label === 'N' || label === 'S' || label === 'E' || label === 'W' ? 1 : 0.7}
                            >
                              {label}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Draw intermediate ticks */}
                      {Array.from({ length: 24 }, (_, i) => {
                        if (i % 3 === 0) return null; // Skip positions where we have main directions
                        const angle = (i * 15 - 90) * (Math.PI / 180);
                        const centerX = 50;
                        const centerY = 50;
                        const borderOuterRadius = 49;
                        const spacing = 3;
                        const compassRadius = borderOuterRadius + spacing;
                        const tickLen = 1;
                        
                        const x1 = centerX + Math.cos(angle) * compassRadius;
                        const y1 = centerY + Math.sin(angle) * compassRadius;
                        const x2 = centerX + Math.cos(angle) * (compassRadius - tickLen);
                        const y2 = centerY + Math.sin(angle) * (compassRadius - tickLen);
                        
                        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} opacity="0.6" />;
                      })}
                    </g>
                  </svg>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


