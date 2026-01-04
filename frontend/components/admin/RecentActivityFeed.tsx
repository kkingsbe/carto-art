'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Activity,
    Eye,
    Map as MapIcon,
    User,
    UserPlus,
    Download,
    MessageSquare,
    LogIn,
    Zap,
    Globe,
    Search
} from 'lucide-react';
import Link from 'next/link';
import { TimeDisplay } from '@/components/ui/time-display';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RecentActivityFeedProps {
    initialEvents: any[];
}

export function RecentActivityFeed({ initialEvents }: RecentActivityFeedProps) {
    const [events, setEvents] = useState(initialEvents);
    const supabase = createClient();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Helpers for event formatting
    const getEventIcon = (type: string) => {
        switch (type) {
            case 'page_view': return <Eye className="w-3.5 h-3.5 text-blue-500" />;
            case 'map_create': return <MapIcon className="w-3.5 h-3.5 text-green-500" />;
            case 'map_publish': return <Globe className="w-3.5 h-3.5 text-purple-500" />;
            case 'poster_export': return <Download className="w-3.5 h-3.5 text-orange-500" />;
            case 'user_signup': return <UserPlus className="w-3.5 h-3.5 text-indigo-500" />;
            case 'user_login': return <LogIn className="w-3.5 h-3.5 text-cyan-500" />;
            case 'feedback_submit': return <MessageSquare className="w-3.5 h-3.5 text-pink-500" />;
            case 'api_request': return <Zap className="w-3.5 h-3.5 text-yellow-500" />;
            case 'map_search': return <Search className="w-3.5 h-3.5 text-slate-500" />;
            default: return <Activity className="w-3.5 h-3.5 text-gray-500" />;
        }
    };

    const getEventDescription = (event: any) => {
        const type = event.event_type;
        const meta = event.metadata || {};
        const pageUrl = event.page_url || '';

        switch (type) {
            case 'page_view':
                if (pageUrl.includes('/admin')) return 'Viewed Admin Dashboard';
                if (pageUrl.includes('/profile')) return 'Viewed Profile';
                if (pageUrl.includes('/gallery')) return 'Browsed Gallery';
                if (pageUrl.includes('/map/')) return 'Viewed a Map';
                if (pageUrl === '/') return 'Visited Landing Page';
                return `Viewed ${pageUrl.split('?')[0] || 'Page'}`;

            case 'map_create':
                return meta.title ? `Created "${meta.title}"` : 'Created a new map';

            case 'map_publish':
                return meta.title ? `Published "${meta.title}"` : 'Published a map';

            case 'poster_export':
                const location = meta.location_name || 'Map';
                return `Exported poster of ${location}`;

            case 'user_signup':
                return 'New user signed up';

            case 'user_login':
                return 'User logged in';

            case 'feedback_submit':
                return 'Submitted feedback';

            case 'api_request':
                return `API Request: ${event.event_name || 'Unknown'}`;

            case 'search_location':
                return `Searched for "${meta.query || 'location'}"`;

            default:
                return event.event_name || type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
    };

    const getUserInitials = (name: string) => {
        return name?.substring(0, 2).toUpperCase() || 'AN';
    };

    useEffect(() => {
        const channel = supabase
            .channel('recent_activity')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'page_events'
                },
                async (payload) => {
                    // Fetch the full event data with profile
                    const { data } = await supabase
                        .from('page_events')
                        .select(`
                            *,
                            profiles:user_id (
                                username,
                                display_name,
                                avatar_url
                            )
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        setEvents(current => [data, ...current].slice(0, 20)); // Keep mostly 20
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('RecentActivityFeed: Subscribed to page_events');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex flex-col h-[600px] shadow-sm">
            <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 rounded-t-xl">
                <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Activity className="w-4 h-4 text-blue-500" />
                    Recent Activity
                </h3>
                <Link href="/admin/activity" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                    View All
                </Link>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-3 pr-3">
                    {events && events.length > 0 ? (
                        events.map((event: any) => (
                            <div key={event.id} className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                                <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700 mt-0.5">
                                    <AvatarImage src={event.profiles?.avatar_url} />
                                    <AvatarFallback className="text-[10px] bg-gray-100 text-gray-500">
                                        {getUserInitials(event.profiles?.display_name || event.profiles?.username || 'AN')}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {event.profiles?.display_name || event.profiles?.username || 'Anonymous User'}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-[10px] text-gray-400 font-mono">
                                            <TimeDisplay date={event.created_at} format="relative" />
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-1.5">
                                        <div className="mt-0.5 shrink-0">
                                            {getEventIcon(event.event_type)}
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 break-words leading-tight">
                                            {getEventDescription(event)}
                                        </p>
                                    </div>

                                    {/* Optional: Show extra metadata like browser/OS for admins if needed, 
                                        but for now we keep it clean as requested */}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                <Activity className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">No recent activity</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
