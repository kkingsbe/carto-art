'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProcessingStagesCardProps {
    debugStages: { name: string; url: string; description?: string }[];
}

export function ProcessingStagesCard({ debugStages }: ProcessingStagesCardProps) {
    if (debugStages.length === 0) return null;

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Processing Stages</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {debugStages.map((stage, i) => (
                        <div key={i} className="space-y-2 border p-2 rounded-lg">
                            <div className="font-medium text-sm truncate" title={stage.name}>{stage.name}</div>
                            <div className="aspect-square relative bg-gray-100 rounded overflow-hidden">
                                <img src={stage.url} alt={stage.name} className="w-full h-full object-contain" />
                            </div>
                            {stage.description && (
                                <p className="text-xs text-muted-foreground">{stage.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
