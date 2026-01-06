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
    Filter,
    X
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TimeDisplay } from '@/components/ui/time-display';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface UserActivityDialogProps {
    userId: string | null;
    username: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function UserActivityDialog({ userId, username, isOpen, onClose }: UserActivityDialogProps) {
    const [events, setEvents] = useState<PageEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchEvents();
        } else {
            setEvents([]);
        }
    }, [isOpen, userId]);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/activity?userId=${userId}&limit=100`);
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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        Activity for {username || 'User'}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                <p className="text-sm text-gray-500">Loading activity events...</p>
                            </div>
                        ) : events.length === 0 ? (
                            <div className="py-20 text-center text-gray-500">
                                No activity recorded for this user yet.
                            </div>
                        ) : (
                            <div className="space-y-6 relative before:absolute before:left-[1.625rem] before:top-2 before:bottom-2 before:w-px before:bg-gray-100 dark:before:bg-gray-800">
                                {events.map((event) => {
                                    const Icon = EVENT_ICONS[event.event_type] || Activity;
                                    const colorClass = EVENT_COLORS[event.event_type] || 'text-gray-500 bg-gray-50';

                                    return (
                                        <div key={event.id} className="relative flex items-start gap-6">
                                            <div className={`p-2.5 rounded-xl shrink-0 z-10 ${colorClass} ring-4 ring-white dark:ring-gray-900`}>
                                                <Icon className="w-4 h-4" />
                                            </div>

                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-center justify-between gap-4">
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                        {event.event_name || event.event_type.replace('_', ' ')}
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                        <TimeDisplay date={event.created_at} format="datetime" />
                                                    </span>
                                                </div>

                                                <div className="mt-1 flex items-center gap-2">
                                                    {event.page_url && (
                                                        <span className="text-xs text-gray-400 truncate">
                                                            on {event.page_url}
                                                        </span>
                                                    )}
                                                </div>

                                                {Object.keys(event.metadata || {}).length > 0 && (
                                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800/50">
                                                        <pre className="text-[10px] font-mono text-gray-500 overflow-x-auto">
                                                            {JSON.stringify(event.metadata, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
