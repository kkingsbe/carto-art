'use client';

import { useEffect, useRef } from 'react';
import { Pane } from 'tweakpane';
import { PosterConfig } from '@/types/poster';

interface AdvancedControlsProps {
    config: PosterConfig;
    updateLayers: (layers: Partial<PosterConfig['layers']>) => void;
    isOpen: boolean;
    onClose: () => void;
}

export function AdvancedControls({ config, updateLayers, isOpen, onClose }: AdvancedControlsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const paneRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current || !isOpen) return;

        // Clean up previous pane
        if (paneRef.current) {
            paneRef.current.dispose();
        }

        const pane: any = new Pane({
            container: containerRef.current,
            title: 'Studio Controls',
        });
        paneRef.current = pane;

        // --- Camera Controls ---
        const cameraFolder = pane.addBlade({
            view: 'folder',
            title: 'Camera (3D)',
            expanded: true,
        });

        // Note: Tweakpane v4 usage of addBinding
        const cameraParams = {
            pitch: config.layers.buildings3DPitch || 0,
            bearing: config.layers.buildings3DBearing || 0,
        };

        cameraFolder.addBinding(cameraParams, 'pitch', {
            min: 0,
            max: 85,
            step: 1,
            label: 'Pitch',
        }).on('change', (ev: any) => {
            updateLayers({ buildings3DPitch: ev.value });
        });

        cameraFolder.addBinding(cameraParams, 'bearing', {
            min: -180,
            max: 180,
            step: 1,
            label: 'Bearing',
        }).on('change', (ev: any) => {
            updateLayers({ buildings3DBearing: ev.value });
        });


        // --- Terrain Controls ---
        const terrainFolder = pane.addBlade({
            view: 'folder',
            title: 'Terrain & Buildings',
            expanded: true,
        });

        // Terrain
        const terrainParams = {
            enabled: config.layers.volumetricTerrain || false,
            exaggeration: config.layers.volumetricTerrainExaggeration || 1,
        };

        terrainFolder.addBinding(terrainParams, 'enabled', {
            label: '3D Terrain'
        }).on('change', (ev: any) => {
            updateLayers({ volumetricTerrain: ev.value });
        });

        terrainFolder.addBinding(terrainParams, 'exaggeration', {
            min: 0,
            max: 5,
            step: 0.1,
            label: 'Elevation Scale',
            disabled: !terrainParams.enabled
        }).on('change', (ev: any) => {
            updateLayers({ volumetricTerrainExaggeration: ev.value });
        });

        // Buildings
        const buildingParams = {
            heightScale: config.layers.buildings3DHeightScale || 1,
            defaultHeight: config.layers.buildings3DDefaultHeight || 10,
        };

        terrainFolder.addBinding(buildingParams, 'heightScale', {
            min: 0.5,
            max: 3,
            step: 0.1,
            label: 'Building Height'
        }).on('change', (ev: any) => {
            updateLayers({ buildings3DHeightScale: ev.value });
        });

        terrainFolder.addBinding(buildingParams, 'defaultHeight', {
            min: 0,
            max: 50,
            step: 1,
            label: 'Min Height'
        }).on('change', (ev: any) => {
            updateLayers({ buildings3DDefaultHeight: ev.value });
        });

        // --- Rendering Quality ---
        const qualityFolder = pane.addBlade({
            view: 'folder',
            title: 'Quality',
            expanded: false,
        });

        const qualityParams = {
            meshQuality: config.layers.terrainMeshQuality || 'balanced'
        };

        qualityFolder.addBinding(qualityParams, 'meshQuality', {
            options: {
                Fast: 'fast',
                Balanced: 'balanced',
                High: 'high',
                Export: 'export',
            },
            label: 'Terrain Mesh'
        }).on('change', (ev: any) => {
            updateLayers({ terrainMeshQuality: ev.value });
        });


        // Actions
        const btn = pane.addButton({
            title: 'Close Studio',
        });
        btn.on('click', () => {
            onClose();
        });

        return () => {
            pane.dispose();
            paneRef.current = null;
        };
    }, [isOpen]);

    // Handle config updates - we can implement partial updates if needed, 
    // but for now we rely on the component mount cycle or just one-way binding

    if (!isOpen) return null;

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: 20,
                right: 20,
                zIndex: 100,
                width: 300,
            }}
            className="shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        />
    );
}
