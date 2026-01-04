'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface TimeDisplayProps {
    date: string | Date;
    format?: 'time' | 'datetime' | 'relative';
    className?: string;
}

export function TimeDisplay({ date, format = 'time', className }: TimeDisplayProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Return a stable placeholder during SSR/Hydration to prevent mismatches
        return <span className={className}>...</span>;
    }

    const d = new Date(date);
    let content;

    switch (format) {
        case 'relative':
            content = formatDistanceToNow(d, { addSuffix: true });
            break;
        case 'datetime':
            content = d.toLocaleString();
            break;
        case 'time':
        default:
            content = d.toLocaleTimeString();
    }

    return (
        <span className={className}>
            {content}
        </span>
    );
}
