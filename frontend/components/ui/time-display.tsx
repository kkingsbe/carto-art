'use client';

import { useEffect, useState } from 'react';

interface TimeDisplayProps {
    date: string | Date;
    format?: 'time' | 'datetime';
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
    return (
        <span className={className}>
            {format === 'time' ? d.toLocaleTimeString() : d.toLocaleString()}
        </span>
    );
}
