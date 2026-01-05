'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface Metric {
    id: string;
    label: string;
    color: string;
}

interface MultiMetricSelectorProps {
    metrics: Metric[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

export function MultiMetricSelector({
    metrics,
    selected,
    onChange,
}: MultiMetricSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');

    // Toggle a metric
    const toggleMetric = (id: string) => {
        if (selected.includes(id)) {
            // Don't allow deselecting the last one? Or maybe allowing empty state is fine?
            // Let's allow empty, but chart might be empty.
            if (selected.length === 1) return; // Prevent empty state for now
            onChange(selected.filter((item) => item !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    const filteredMetrics = metrics.filter(m =>
        m.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[250px] justify-between text-xs"
                >
                    {selected.length === 0
                        ? "Select metrics..."
                        : selected.length === 1
                            ? metrics.find((m) => m.id === selected[0])?.label
                            : `${selected.length} metrics selected`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="end">
                <div className="flex flex-col max-h-[400px]">
                    <div className="flex items-center border-b px-3 py-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-6 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Search metrics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="overflow-y-auto p-1">
                        {filteredMetrics.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">No metrics found.</div>
                        ) : (
                            filteredMetrics.map((metric) => (
                                <div
                                    key={metric.id}
                                    onClick={() => toggleMetric(metric.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                        "select-none"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                            selected.includes(metric.id)
                                                ? "bg-primary text-primary-foreground"
                                                : "opacity-50 [&_svg]:invisible"
                                        )}
                                    >
                                        <Check className={cn("h-4 w-4")} />
                                    </div>
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: metric.color }} />
                                        <span>{metric.label}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
