'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_CONFIG } from '@/lib/config/defaults';

// Types
export interface LocationState {
    center: [number, number];
    zoom: number;
}

export interface FormatState {
    orientation: 'portrait' | 'landscape';
    width: number;
    height: number;
}

export interface PlaygroundState {
    location: LocationState;
    styleId: string;
    format: FormatState;
    apiKey: string;
    isLoading: boolean;
    response: any | null;
    error: string | null;
}

export interface PlaygroundContextType extends PlaygroundState {
    setLocation: (loc: LocationState) => void;
    setStyleId: (id: string) => void;
    setFormat: (fmt: FormatState) => void;
    setApiKey: (key: string) => void;
    generatePoster: () => Promise<void>;
    reset: () => void;
}

const defaultLocation: LocationState = {
    center: [-73.985, 40.748], // NYC
    zoom: 12
};

const defaultFormat: FormatState = {
    orientation: 'portrait',
    width: 1200,
    height: 1800
};

const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

export function PlaygroundProvider({ children }: { children: React.ReactNode }) {
    const [location, setLocation] = useState<LocationState>(defaultLocation);
    const [styleId, setStyleId] = useState<string>('minimal'); // Default style
    const [format, setFormat] = useState<FormatState>(defaultFormat);
    const [apiKey, setApiKey] = useState<string>('ca_live_demo_sandbox_key_2024');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load first available key on mount if none selected
    useEffect(() => {
        // Can be enhanced to auto-select key
    }, []);

    const generatePoster = async () => {
        if (!apiKey) {
            setError('Please select or generate an API Key first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResponse(null);

        try {
            const payload = {
                config: {
                    location,
                    style: { id: styleId },
                    format: { orientation: format.orientation },
                    palette: DEFAULT_CONFIG.palette
                },
                resolution: { width: format.width, height: format.height }
            };
            console.log('[Playground] Sending Payload:', JSON.stringify(payload, null, 2));

            const res = await fetch('/api/v1/posters/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}` // In real app, might proxy via backend or use strict CORS
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to generate poster');
            }

            setResponse(data);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setLocation(defaultLocation);
        setResponse(null);
        setError(null);
    };

    return (
        <PlaygroundContext.Provider
            value={{
                location,
                styleId,
                format,
                apiKey,
                isLoading,
                response,
                error,
                setLocation,
                setStyleId,
                setFormat,
                setApiKey,
                generatePoster,
                reset
            }}
        >
            {children}
        </PlaygroundContext.Provider>
    );
}

export function usePlayground() {
    const context = useContext(PlaygroundContext);
    if (context === undefined) {
        throw new Error('usePlayground must be used within a PlaygroundProvider');
    }
    return context;
}
