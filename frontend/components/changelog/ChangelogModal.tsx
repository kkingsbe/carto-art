'use client';

import { useState, useEffect, ReactNode, useRef } from 'react';
import { X, Sparkles, Bell } from 'lucide-react';
import { getPublishedChangelog, type ChangelogEntry } from '@/lib/actions/changelog';
import { trackEventAction } from '@/lib/actions/events';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, getSessionId } from '@/lib/utils';

const LAST_SEEN_KEY = 'changelog_last_seen';

interface ChangelogModalProps {
    trigger?: ReactNode;
    showFloatingButton?: boolean;
}

export function ChangelogModal({ trigger, showFloatingButton = false }: ChangelogModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [entries, setEntries] = useState<ChangelogEntry[]>([]);
    const [hasNew, setHasNew] = useState(false);
    const openTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            openTimeRef.current = Date.now();
            trackEventAction({
                eventType: 'changelog_view',
                sessionId: getSessionId(),
            });
        } else if (openTimeRef.current) {
            const duration = Math.round((Date.now() - openTimeRef.current) / 1000);
            trackEventAction({
                eventType: 'changelog_close',
                sessionId: getSessionId(),
                metadata: { duration_seconds: duration }
            });
            openTimeRef.current = null;
        }
    }, [isOpen]);

    useEffect(() => {
        fetchAndCheck();
    }, []);

    const fetchAndCheck = async () => {
        try {
            const data = await getPublishedChangelog();
            setEntries(data);

            const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
            if (data.length > 0) {
                const latestDate = new Date(data[0].published_at).getTime();
                const lastSeenDate = lastSeen ? parseInt(lastSeen, 10) : 0;

                if (latestDate > lastSeenDate) {
                    setHasNew(true);
                    if (!lastSeen && showFloatingButton) {
                        setIsOpen(true);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch changelog:', error);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        if (entries.length > 0) {
            localStorage.setItem(LAST_SEEN_KEY, new Date(entries[0].published_at).getTime().toString());
            setHasNew(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    if (entries.length === 0 && !trigger) return null;

    return (
        <>
            {/* Custom Trigger */}
            {trigger && (
                <span onClick={handleOpen} className="cursor-pointer">
                    {trigger}
                </span>
            )}

            {/* Floating Button */}
            {showFloatingButton && !trigger && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpen}
                    className="fixed bottom-4 right-4 z-40 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:text-white shadow-lg group"
                >
                    <Bell className="w-4 h-4 mr-2" />
                    What's New
                    {hasNew && (
                        <span className="ml-2 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    )}
                </Button>
            )}

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <div
                        className="bg-[#0f1424] border border-white/10 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">What's New</h2>
                                    <p className="text-sm text-white/50">Latest updates and features</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                            {entries.length === 0 ? (
                                <p className="text-white/50 text-center py-8">No updates yet. Check back soon!</p>
                            ) : (
                                entries.map((entry, index) => (
                                    <div
                                        key={entry.id}
                                        className={cn(
                                            "relative pl-6 pb-6",
                                            index < entries.length - 1 && "border-l border-white/10"
                                        )}
                                    >
                                        <div className="absolute left-0 top-0 w-3 h-3 -translate-x-1.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />

                                        <div className="mb-2">
                                            <Badge variant="secondary" className="bg-white/5 text-white/50 text-xs">
                                                {new Date(entry.published_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Badge>
                                        </div>

                                        <h3 className="text-lg font-semibold text-white mb-1">{entry.title}</h3>
                                        <p className="text-sm text-white/70 leading-relaxed">{entry.description}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 bg-white/5">
                            <Button
                                onClick={handleClose}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                            >
                                Got it!
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
