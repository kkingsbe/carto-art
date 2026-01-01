'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PosterConfig, SavedProject } from '@/types/poster';
import { safeGetItem, safeSetItem } from '@/lib/storage/safeStorage';
import { logger } from '@/lib/logger';
import { saveMap, saveMapWithThumbnail, updateMap, updateMapThumbnail, deleteMap, getUserMaps } from '@/lib/actions/maps';
import { uploadThumbnail } from '@/lib/actions/storage';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'carto-art-saved-projects';

/**
 * Hook for managing saved poster projects.
 * Uses Supabase server actions when authenticated, falls back to localStorage when not.
 * 
 * @returns Object containing:
 * - projects: Array of saved projects
 * - saveProject: Save a new project
 * - deleteProject: Delete a project by ID
 * - renameProject: Rename a project
 * - isLoaded: Whether projects have been loaded
 * - storageError: Error message if storage operations fail
 * - isAuthenticated: Whether user is authenticated
 * 
 * @example
 * ```tsx
 * const { projects, saveProject, deleteProject } = useSavedProjects();
 * saveProject('My Poster', currentConfig);
 * ```
 */
export function useSavedProjects() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication and load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const authenticated = !!user;

        setIsAuthenticated(authenticated);

        if (authenticated) {
          // Load from Supabase
          try {
            const maps = await getUserMaps();
            setProjects(maps.map(map => ({
              id: map.id,
              name: map.title,
              config: map.config,
              updatedAt: new Date(map.updated_at).getTime(),
            })));
            setStorageError(null);
          } catch (error) {
            logger.error('Failed to load maps from server', error);
            setStorageError('Failed to load maps. Using local storage.');
            // Fallback to localStorage
            const stored = safeGetItem(STORAGE_KEY);
            if (stored) {
              try {
                setProjects(JSON.parse(stored));
              } catch (e) {
                logger.error('Failed to parse saved projects', e);
              }
            }
          }
        } else {
          // Load from localStorage
          const stored = safeGetItem(STORAGE_KEY);
          if (stored) {
            try {
              setProjects(JSON.parse(stored));
            } catch (e) {
              logger.error('Failed to parse saved projects', e);
              setStorageError('Failed to load saved projects');
            }
          }
        }
      } catch (error) {
        logger.error('Failed to initialize projects', error);
        // Fallback to localStorage
        const stored = safeGetItem(STORAGE_KEY);
        if (stored) {
          try {
            setProjects(JSON.parse(stored));
          } catch (e) {
            logger.error('Failed to parse saved projects', e);
          }
        }
      } finally {
        setIsLoaded(true);
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Save to localStorage as fallback (only when not authenticated)
  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      const success = safeSetItem(STORAGE_KEY, JSON.stringify(projects));
      if (!success) {
        setStorageError('Failed to save projects. Storage may be full or unavailable.');
      } else {
        setStorageError(null);
      }
    }
  }, [projects, isLoaded, isAuthenticated]);

  const saveProject = useCallback(async (name: string, config: PosterConfig, thumbnailBlob?: Blob): Promise<SavedProject> => {
    if (isAuthenticated) {
      // Save to Supabase
      try {
        let savedMap;

        if (thumbnailBlob) {
          // First save the map to get an ID
          const tempMap = await saveMap(config, name);

          // Get current user for thumbnail upload
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            try {
              // Upload thumbnail
              const thumbnailUrl = await uploadThumbnail(tempMap.id, user.id, thumbnailBlob);

              // Update the map with thumbnail URL using server action
              savedMap = await updateMapThumbnail(tempMap.id, thumbnailUrl);
            } catch (thumbnailError) {
              logger.error('Failed to upload thumbnail:', thumbnailError);
              // Continue without thumbnail
              savedMap = tempMap;
            }
          } else {
            savedMap = tempMap;
          }
        } else {
          savedMap = await saveMap(config, name);
        }

        const savedProject: SavedProject = {
          id: savedMap.id,
          name: savedMap.title,
          config: savedMap.config,
          updatedAt: new Date(savedMap.created_at).getTime(),
        };

        setProjects(prev => [savedProject, ...prev]);
        setStorageError(null);
        return savedProject;
      } catch (error) {
        logger.error('Failed to save map to server', error);
        setStorageError('Failed to save map. Please try again.');
        throw error;
      }
    } else {
      // Save to localStorage
      const newProject: SavedProject = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
        name,
        config,
        updatedAt: Date.now(),
      };
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    }
  }, [isAuthenticated]);

  const deleteProject = useCallback(async (id: string) => {
    if (isAuthenticated) {
      try {
        await deleteMap(id);
        setProjects(prev => prev.filter(p => p.id !== id));
        setStorageError(null);
      } catch (error) {
        logger.error('Failed to delete map from server', error);
        setStorageError('Failed to delete map. Please try again.');
        throw error;
      }
    } else {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  }, [isAuthenticated]);

  const renameProject = useCallback(async (id: string, name: string) => {
    if (isAuthenticated) {
      try {
        await updateMap(id, projects.find(p => p.id === id)!.config, name);
        setProjects(prev => prev.map(p => 
          p.id === id ? { ...p, name, updatedAt: Date.now() } : p
        ));
        setStorageError(null);
      } catch (error) {
        logger.error('Failed to rename map on server', error);
        setStorageError('Failed to rename map. Please try again.');
        throw error;
      }
    } else {
      setProjects(prev => prev.map(p => 
        p.id === id ? { ...p, name, updatedAt: Date.now() } : p
      ));
    }
  }, [isAuthenticated, projects]);

  return {
    projects,
    saveProject,
    deleteProject,
    renameProject,
    isLoaded,
    storageError,
    isAuthenticated: isAuthenticated ?? false,
    isLoading,
  };
}

