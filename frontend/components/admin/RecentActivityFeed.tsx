'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Fingerprint } from 'lucide-react';
import Link from 'next/link';
import { TimeDisplay } from '@/components/ui/time-display';

interface RecentActivityFeedProps {
    initialEvents: any[];
}

export function RecentActivityFeed({ initialEvents }: RecentActivityFeedProps) {
    const [events, setEvents] = useState(initialEvents);
    const supabase = createClient();

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
                async () => {
                    // Fetch updated list with profiles
                    const { data } = await supabase
                        .from('page_events')
                        .select(`
                            *,
                            profiles:user_id (
                                username,
                                display_name
                            )
                        `)
                        .order('created_at', { ascending: false })
                        .limit(5);

                    if (data) {
                        setEvents(data);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 md:p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold flex items-center gap-2">
                    <Fingerprint className="w-4 h-4" />
                    Recent Activity
                </h3>
                <Link href="/admin/activity" className="text-xs text-blue-500 hover:underline">View All</Link>
            </div>

            <div className="space-y-6 flex-1">
                {events && events.length > 0 ? (
                    events.map((event: any) => (
                        <div key={event.id} className="flex gap-4">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm truncate">
                                    <span className="font-medium">
                                        {event.profiles?.display_name || event.profiles?.username || 'Anonymous'}
                                    </span>
                                    {' '}{event.event_name?.toLowerCase() || event.event_type}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    <TimeDisplay date={event.created_at} />
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
                )}
            </div>
        </div>
    );
}
