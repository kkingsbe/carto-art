'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PosterConfig, SavedProject } from '@/types/poster';

const STORAGE_KEY = 'carto-art-saved-projects';

export function useSavedProjects() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load projects from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProjects(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved projects', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects, isLoaded]);

  const saveProject = useCallback((name: string, config: PosterConfig) => {
    const newProject: SavedProject = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      name,
      config,
      updatedAt: Date.now(),
    };
    setProjects(prev => [newProject, ...prev]);
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, name, updatedAt: Date.now() } : p
    ));
  }, []);

  return {
    projects,
    saveProject,
    deleteProject,
    renameProject,
    isLoaded
  };
}

