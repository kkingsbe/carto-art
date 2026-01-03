import { useState, useCallback, useEffect, MutableRefObject } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Map as MapLibreMap } from 'maplibre-gl';
import { getMapById } from '@/lib/actions/maps';
import { generateThumbnail } from '@/lib/export/thumbnail';
import { isConfigEqual, cloneConfig } from '@/lib/utils/configComparison';
import { DEFAULT_CONFIG } from '@/lib/config/defaults';
import type { PosterConfig, SavedProject } from '@/types/poster';

export interface MapStatus {
    isSaved: boolean;
    isPublished: boolean;
    hasUnsavedChanges: boolean;
}

interface UseProjectManagerProps {
    config: PosterConfig;
    setConfig: (config: PosterConfig) => void;
    isAuthenticated: boolean;
    saveProjectApi: (name: string, config: PosterConfig, thumbnailBlob?: Blob) => Promise<SavedProject>;
    handleError: (error: unknown) => void;
    mapInstanceRef: MutableRefObject<MapLibreMap | null>;
}

export function useProjectManager({
    config,
    setConfig,
    isAuthenticated,
    saveProjectApi,
    handleError,
    mapInstanceRef
}: UseProjectManagerProps) {
    const router = useRouter();
    const pathname = usePathname();

    const [currentMapId, setCurrentMapId] = useState<string | null>(null);
    const [currentMapName, setCurrentMapName] = useState<string | null>(null);
    const [originalConfig, setOriginalConfig] = useState<PosterConfig | null>(null);
    const [currentMapStatus, setCurrentMapStatus] = useState<MapStatus | null>(null);

    // Handle loading a saved project
    const loadProject = useCallback(async (project: SavedProject) => {
        setConfig(project.config);
        setCurrentMapId(project.id);
        setCurrentMapName(project.name);
        setOriginalConfig(cloneConfig(project.config));

        // Fetch full metadata if authenticated
        if (isAuthenticated) {
            try {
                const fullMap = await getMapById(project.id);
                if (fullMap) {
                    setCurrentMapStatus({
                        isSaved: true,
                        isPublished: fullMap.is_published,
                        hasUnsavedChanges: false
                    });
                    return;
                }
            } catch (error) {
                console.error('Failed to fetch map metadata:', error);
            }
        }

        // Fallback
        setCurrentMapStatus({
            isSaved: true,
            isPublished: false,
            hasUnsavedChanges: false
        });
    }, [setConfig, isAuthenticated]);

    // Handle saving a project
    const saveProject = useCallback(async (name: string, posterConfig?: PosterConfig) => {
        const configToSave = posterConfig || config;

        // Generate thumbnail if map is available and user is authenticated
        let thumbnailBlob: Blob | undefined;
        if (mapInstanceRef.current && isAuthenticated) {
            try {
                thumbnailBlob = await generateThumbnail(mapInstanceRef.current, configToSave);
            } catch (error) {
                console.error('Failed to generate thumbnail:', error);
                // Continue without thumbnail
            }
        }

        // Save the project and get the saved project back
        const savedProject = await saveProjectApi(name, configToSave, thumbnailBlob);

        // Automatically load the saved project
        await loadProject(savedProject);
    }, [saveProjectApi, loadProject, isAuthenticated, mapInstanceRef, config]);

    // Handle save a copy - always creates a NEW project and switches to it
    const saveCopy = useCallback(async (name: string) => {
        // Generate thumbnail if map is available and user is authenticated
        let thumbnailBlob: Blob | undefined;
        if (mapInstanceRef.current && isAuthenticated) {
            try {
                thumbnailBlob = await generateThumbnail(mapInstanceRef.current, config);
            } catch (error) {
                console.error('Failed to generate thumbnail:', error);
                // Continue without thumbnail
            }
        }

        // Always create NEW project (never update existing)
        const savedProject = await saveProjectApi(name, config, thumbnailBlob);

        // Switch to the newly created copy
        setCurrentMapId(savedProject.id);
        setCurrentMapName(savedProject.name);
        setOriginalConfig(cloneConfig(savedProject.config));
        setCurrentMapStatus({
            isSaved: true,
            isPublished: false,
            hasUnsavedChanges: false
        });

        // Update URL to reflect new map
        router.replace(`/?map=${savedProject.id}`, { scroll: false });
    }, [saveProjectApi, config, isAuthenticated, router, mapInstanceRef]);

    // Handle publish success
    const refreshStatus = useCallback(async () => {
        if (!currentMapId || !isAuthenticated) return;

        try {
            const fullMap = await getMapById(currentMapId);
            if (fullMap) {
                setCurrentMapStatus(prev => prev ? { ...prev, isPublished: fullMap.is_published } : null);
            }
        } catch (error) {
            console.error('Failed to refresh map status:', error);
        }
    }, [currentMapId, isAuthenticated]);

    // Handle reset
    const resetProject = useCallback(() => {
        setCurrentMapId(null);
        setCurrentMapName(null);
        setOriginalConfig(null);
        setCurrentMapStatus(null);
        setConfig(DEFAULT_CONFIG);
        router.replace(pathname, { scroll: false });
    }, [setConfig, router, pathname]);

    // Detect unsaved changes
    useEffect(() => {
        if (currentMapId && originalConfig) {
            const hasChanges = !isConfigEqual(config, originalConfig);
            setCurrentMapStatus(prev => prev ? { ...prev, hasUnsavedChanges: hasChanges } : null);
        }
    }, [config, originalConfig, currentMapId]);

    // Handle Remix from URL
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const searchParams = new URLSearchParams(window.location.search);
        const remixId = searchParams.get('remix');

        if (remixId) {
            const loadRemix = async () => {
                try {
                    const mapData = await getMapById(remixId);
                    if (mapData) {
                        setConfig(mapData.config);
                        setCurrentMapName(`${mapData.title} (Remix)`);
                        setCurrentMapId(null); // Force it to be a new project on save
                        setOriginalConfig(null); // Mark as dirty
                        // Force status to show unsaved changes
                        setCurrentMapStatus({
                            isSaved: false,
                            isPublished: false,
                            hasUnsavedChanges: true
                        });

                        // Clear the remix param from URL
                        const newParams = new URLSearchParams(window.location.search);
                        newParams.delete('remix');
                        const newUrl = `${pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`;
                        router.replace(newUrl, { scroll: false });
                    }
                } catch (error) {
                    console.error('Failed to load remix map:', error);
                    handleError(new Error('Failed to load the map for remixing.'));
                }
            };

            loadRemix();
        }
    }, [setConfig, pathname, router, handleError]);

    return {
        currentMapId,
        currentMapName,
        currentMapStatus,
        loadProject,
        saveProject,
        saveCopy,
        resetProject,
        refreshStatus
    };
}
