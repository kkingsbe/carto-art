'use client';

import { useState, useEffect } from 'react';
import {
    Activity,
    UserPlus,
    Map as MapIcon,
    Download,
    Key,
    Terminal,
    Loader2,
    Search,
    Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TimeDisplay } from '@/components/ui/time-display';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PageEvent {
    id: string;
    event_type: string;
    event_name: string;
    page_url: string;
    created_at: string;
    metadata: any;
    profiles: {
        username: string;
        display_name: string;
        avatar_url: string;
    } | null;
}

const EVENT_ICONS: Record<string, any> = {
    signup: UserPlus,
    map_create: MapIcon,
    map_publish: MapIcon,
    poster_export: Download,
    key_generate: Key,
    api_call: Terminal,
};

const EVENT_COLORS: Record<string, string> = {
    signup: 'text-green-500 bg-green-50 dark:bg-green-900/10',
    map_create: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
    map_publish: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10',
    poster_export: 'text-orange-500 bg-orange-50 dark:bg-orange-900/10',
    key_generate: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
    api_call: 'text-gray-500 bg-gray-50 dark:bg-gray-800',
};

export default function ActivityPage() {
    const [events, setEvents] = useState<PageEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEventType, setSelectedEventType] = useState<string>('all');

    useEffect(() => {
        fetchEvents();
    }, [selectedEventType]);

    const fetchEvents = async () => {
        try {
            const params = new URLSearchParams({ limit: '100' });
            if (selectedEventType && selectedEventType !== 'all') {
                params.append('event_type', selectedEventType);
            }

            const res = await fetch(`/api/admin/activity?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events);
            }
        } catch (error) {
            console.error('Failed to load events');
        } finally {
            setIsLoading(false);
        }
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
                    <h1 className="text-2xl font-bold tracking-tight">Activity Feed</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Live stream of events across the platform.
                    </p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input className="pl-10" placeholder="Filter events..." />
                </div>
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Display Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {Object.entries(EVENT_ICONS).map(([type]) => (
                            <SelectItem key={type} value={type}>
                                {type.replace('_', ' ')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {events.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No activity recorded yet.
                        </div>
                    ) : (
                        events.map((event) => {
                            const Icon = EVENT_ICONS[event.event_type] || Activity;
                            const colorClass = EVENT_COLORS[event.event_type] || 'text-gray-500 bg-gray-50';

                            return (
                                <div key={event.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors flex items-start gap-6">
                                    <div className={`p-3 rounded-xl shrink-0 ${colorClass}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-4">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {event.event_name || event.event_type.replace('_', ' ')}
                                            </p>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                <TimeDisplay date={event.created_at} format="datetime" />
                                            </span>
                                        </div>

                                        <div className="mt-1 flex items-center gap-3">
                                            {event.profiles ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                                        {event.profiles.avatar_url ? (
                                                            <img src={event.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : null}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        {event.profiles.display_name || event.profiles.username}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Anonymous User</span>
                                            )}

                                            {event.page_url && (
                                                <span className="text-xs text-gray-400 truncate max-w-xs">
                                                    on {event.page_url}
                                                </span>
                                            )}
                                        </div>

                                        {Object.keys(event.metadata).length > 0 && (
                                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800/50">
                                                <pre className="text-[10px] font-mono text-gray-500 overflow-x-auto">
                                                    {JSON.stringify(event.metadata, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div >
    );
}
