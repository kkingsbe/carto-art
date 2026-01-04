import { useState, useEffect } from 'react';
import { PosterConfig } from '@/types/poster';

export interface Vista {
    id: string;
    name: string;
    description: string;
    location: PosterConfig['location'];
}

export function useVistas() {
    const [vistas, setVistas] = useState<Vista[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVistas() {
            try {
                const res = await fetch('/api/vistas');
                if (!res.ok) throw new Error('Failed to fetch vistas');
                const data = await res.json();
                setVistas(data.vistas || []);
            } catch (e: any) {
                setError(e.message);
                // Fallback to empty array if API fails
                setVistas([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchVistas();
    }, []);

    return { vistas, isLoading, error };
}
