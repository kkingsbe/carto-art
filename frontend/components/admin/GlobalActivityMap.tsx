'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapPreview } from '@/components/map/MapPreview';
import { darkModeStyle } from '@/lib/styles/dark-mode';
import { midnightStyle } from '@/lib/styles/midnight';
import { PosterConfig, CustomMarker } from '@/types/poster';
import { Loader2, RefreshCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapConfigPanel, AdminMapConfig } from './MapConfigPanel';

const DEFAULT_CONFIG: AdminMapConfig = {
    styleId: 'dark-neon',
    markerColor: '#00F5FF',
    showLabels: false,
    showPopulation: false,
    showSavedMaps: true,
    showExports: true
};

export function GlobalActivityMap() {
    const [rawMaps, setRawMaps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [config, setConfig] = useState<AdminMapConfig>(DEFAULT_CONFIG);
    const [viewState, setViewState] = useState<any>(null);

    // Load persisted config and view on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem('carto_admin_map_config');
        if (savedConfig) {
            try {
                // Merge with default to handle new keys (like showPopulation)
                setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) });
            } catch (e) {
                console.error('Failed to parse saved config');
            }
        }

        const savedView = localStorage.getItem('carto_admin_map_view');
        if (savedView) {
            try {
                setViewState(JSON.parse(savedView));
            } catch (e) { console.error('Failed to parse saved view'); }
        }

        fetchMapData();
    }, []);

    // Save config on change
    useEffect(() => {
        localStorage.setItem('carto_admin_map_config', JSON.stringify(config));
    }, [config]);

    // Save view on change (debounced via MapPreview callbacks ideally, but simplified here)
    const handleMoveEnd = (center: [number, number], zoom: number) => {
        const view = { center, zoom };
        setViewState(view);
        localStorage.setItem('carto_admin_map_view', JSON.stringify(view));
    };

    const fetchMapData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/stats/maps?limit=200');
            if (res.ok) {
                const data = await res.json();
                setRawMaps(data);
            }
        } catch (error) {
            console.error('Failed to load map data', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Derive markers from raw data and config
    const markers: CustomMarker[] = useMemo(() => {
        return rawMaps
            .filter((item: any) => {
                if (item.source === 'map' && !config.showSavedMaps) return false;
                if (item.source === 'export' && !config.showExports) return false;
                return true;
            })
            .map((item: any) => ({
                id: item.id,
                lat: item.lat,
                lng: item.lng,
                type: 'dot',
                color: item.source === 'export' ? '#FF00FF' : config.markerColor,
                size: item.source === 'export' ? 12 : 15,
                label: item.title,
                labelStyle: 'glass',
                labelColor: item.source === 'export' ? '#FF00FF' : config.markerColor,
                labelSize: 10
            }));
    }, [rawMaps, config.markerColor, config.showSavedMaps, config.showExports]);

    // Derive map style from config
    const activeStyle = config.styleId === 'midnight' ? midnightStyle : darkModeStyle;
    const activePalette = activeStyle.palettes.find(p => p.id === config.styleId) || activeStyle.defaultPalette;

    const mapConfig: PosterConfig = {
        location: {
            name: 'World',
            center: viewState?.center || [0, 20],
            bounds: [[-180, -90], [180, 90]],
            zoom: viewState?.zoom || 1.5
        },
        style: activeStyle,
        palette: activePalette,
        typography: {
            titleFont: 'Inter',
            titleSize: 80,
            titleWeight: 700,
            subtitleFont: 'Inter',
            subtitleSize: 40,
            showTitle: false,
            showSubtitle: false,
            position: 'bottom',
        },
        format: {
            aspectRatio: '16:9',
            orientation: 'landscape',
            margin: 0,
            borderStyle: 'none',
            texture: 'none'
        },
        layers: {
            streets: true,
            buildings: false,
            water: true,
            parks: false,
            terrain: false,
            terrainUnderWater: false,
            hillshadeExaggeration: 0,
            contours: false,
            contourDensity: 0,
            population: config.showPopulation,
            labels: config.showLabels,
            labelSize: 12,
            labelMaxWidth: 10,
            marker: false,
            roadWeight: 1,
            railroads: false,
            connectMarkers: false,
            fillMarkers: false,
            showSegmentLengths: false
        },
        markers: markers,
        is3DMode: false
    };

    const handleReset = () => {
        setConfig(DEFAULT_CONFIG);
        setViewState(null); // Will revert to default props in MapPreview if we passed undefined, but here we pass default if null
        localStorage.removeItem('carto_admin_map_config');
        localStorage.removeItem('carto_admin_map_view');
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm h-[500px] relative group">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h3 className="text-sm font-semibold text-white/90 drop-shadow-md flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"
                        style={{ color: config.markerColor, backgroundColor: config.markerColor }}
                    />
                    Global Activity Map
                </h3>
                <p className="text-xs text-white/60 drop-shadow-md">
                    Recent creation locations
                </p>
            </div>

            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                    onClick={() => setShowSettings(!showSettings)}
                >
                    <Settings className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                    onClick={() => fetchMapData()}
                    disabled={isLoading}
                >
                    <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {showSettings && (
                <MapConfigPanel
                    config={config}
                    onChange={setConfig}
                    onClose={() => setShowSettings(false)}
                    onReset={handleReset}
                />
            )}

            <div className="w-full h-full bg-slate-950">
                <MapPreview
                    {...mapConfig}
                    mapStyle={mapConfig.style.mapStyle}
                    layerToggles={mapConfig.style.layerToggles}
                    location={mapConfig.location}
                    locked={false}
                    onMoveEnd={handleMoveEnd}
                />
            </div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: config.markerColor }} />
                </div>
            )}
        </div>
    );
}
