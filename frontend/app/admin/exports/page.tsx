'use client';

import { useState, useEffect } from 'react';
import {
    Download,
    Map as MapIcon,
    User,
    Clock,
    Monitor,
    Maximize,
    Loader2,
    ExternalLink,
    Search,
    Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ExportEvent {
    id: string;
    event_type: string;
    event_name: string;
    created_at: string;
    metadata: {
        location_name?: string;
        location_coords?: [number, number];
        style_name?: string;
        resolution?: {
            name?: string;
            width: number;
            height: number;
            pixelRatio: number;
        };
        render_time_ms?: number;
        source?: 'api' | 'in-app';
        download_url?: string;
        thumbnail_url?: string;
        poster_id?: string;

    };
    profiles: {
        username: string;
        display_name: string;
        avatar_url: string;
    } | null;
}

export default function ExportsPage() {
    const [exports, setExports] = useState<ExportEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchExports();
    }, []);

    const fetchExports = async () => {
        try {
            const res = await fetch('/api/admin/exports?limit=50');
            if (res.ok) {
                const data = await res.json();
                setExports(data.exports);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Failed to load exports');
        } finally {
            setIsLoading(false);
        }
    };

    const formatMs = (ms?: number) => {
        if (!ms) return 'N/A';
        return (ms / 1000).toFixed(1) + 's';
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Export Feed</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Detailed record of all {total} poster generations.
                    </p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input className="pl-10" placeholder="Search by location, user, or style..." />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {exports.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center text-gray-500">
                        No exports found.
                    </div>
                ) : (
                    exports.map((exp) => (
                        <Card key={exp.id} className="overflow-hidden border-gray-200 dark:border-gray-800">
                            <div className="p-5 flex flex-col md:flex-row gap-6">
                                {/* Thumbnail Placeholder/Preview */}
                                <div className="w-full md:w-32 h-44 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-800 relative group">
                                    {(exp.metadata.thumbnail_url || exp.metadata.download_url) ? (
                                        <img
                                            src={exp.metadata.thumbnail_url || exp.metadata.download_url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (

                                        <MapIcon className="w-8 h-8 text-gray-300" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Download className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-lg leading-none mb-1 truncate">
                                                {exp.metadata.location_name || 'Unnamed Location'}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <User className="w-3.5 h-3.5" />
                                                {exp.profiles ? (
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                                        {exp.profiles.display_name || exp.profiles.username}
                                                    </span>
                                                ) : (
                                                    <span className="italic">Anonymous</span>
                                                )}
                                                <span>•</span>
                                                <span>{new Date(exp.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <Badge variant={exp.metadata.source === 'api' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                                            {exp.metadata.source || 'in-app'}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Style</p>
                                            <p className="text-sm font-medium">{exp.metadata.style_name || 'Default'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resolution</p>
                                            <p className="text-sm font-medium">
                                                {exp.metadata.resolution ?
                                                    `${exp.metadata.resolution.width}x${exp.metadata.resolution.height}${exp.metadata.resolution.pixelRatio ? ` @${exp.metadata.resolution.pixelRatio}x` : ''}` :
                                                    'Standard'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Render Time</p>
                                            <div className="flex items-center gap-1.5 text-sm font-medium">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                {formatMs(exp.metadata.render_time_ms)}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</p>
                                            <p className="text-sm font-medium">
                                                {exp.metadata.resolution?.name === 'ORBIT_GIF' ? 'GIF' :
                                                    exp.metadata.resolution?.name === 'ORBIT_VIDEO' ? 'Video' :
                                                        'Image'}
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-right md:text-left">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
                                            <p className="text-sm font-medium">
                                                {exp.metadata.poster_id ? 'Stored' : 'Local Only'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        {exp.metadata.download_url && (
                                            <Button size="sm" variant="outline" className="gap-2 h-8 text-xs" onClick={() => window.open(exp.metadata.download_url, '_blank')}>
                                                <ExternalLink className="w-3 h-3" />
                                                View Full Size
                                            </Button>
                                        )}
                                        {exp.metadata.location_coords && (
                                            <Button size="sm" variant="ghost" className="gap-2 h-8 text-xs text-gray-500" onClick={() => window.open(`https://www.google.com/maps?q=${exp.metadata.location_coords?.[1]},${exp.metadata.location_coords?.[0]}`, '_blank')}>
                                                <Maximize className="w-3 h-3" />
                                                Google Maps
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

