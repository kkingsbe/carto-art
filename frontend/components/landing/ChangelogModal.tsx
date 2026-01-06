'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, X, Calendar } from 'lucide-react';
import { getPublishedChangelog, ChangelogEntry } from '@/lib/actions/changelog';
import { format } from 'date-fns';

export function ChangelogModal({ trigger }: { trigger?: React.ReactNode }) {
    const [entries, setEntries] = useState<ChangelogEntry[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && entries.length === 0) {
            fetchEntries();
        }
    }, [isOpen]);

    const fetchEntries = async () => {
        setIsLoading(true);
        try {
            const data = await getPublishedChangelog();
            setEntries(data);
        } catch (error) {
            console.error('Failed to fetch changelog:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2">
                        <Sparkles className="w-4 h-4" />
                        What's New
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-blue-400" />
                        </div>
                        Changelog
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? (
                        <div className="flex flex-col gap-8 py-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse space-y-3">
                                    <div className="h-4 bg-gray-800 rounded w-1/4" />
                                    <div className="h-6 bg-gray-800 rounded w-3/4" />
                                    <div className="h-20 bg-gray-800 rounded w-full" />
                                </div>
                            ))}
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No updates yet. Check back soon!
                        </div>
                    ) : (
                        <div className="flex flex-col gap-12 py-4">
                            {entries.map((entry) => (
                                <div key={entry.id} className="relative pl-8 border-l border-gray-800 pb-2">
                                    {/* Timeline Dot */}
                                    <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />

                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(entry.published_at), 'MMMM d, yyyy')}
                                    </div>

                                    <h3 className="text-xl font-bold mb-3 text-white tracking-tight">
                                        {entry.title}
                                    </h3>

                                    <div className="text-gray-400 leading-relaxed text-sm whitespace-pre-wrap">
                                        {entry.description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-center text-[10px] text-gray-600 uppercase tracking-widest">
                    Continuously improving for you
                </div>
            </DialogContent>
        </Dialog>
    );
}
