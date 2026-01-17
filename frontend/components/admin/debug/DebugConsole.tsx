'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DebugConsoleProps {
    logs: string[];
    onClear: () => void;
}

export function DebugConsole({ logs, onClear }: DebugConsoleProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Debug Console</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-md h-64 overflow-y-auto">
                    {logs.length === 0 ? (
                        <span className="text-gray-500">// Waiting for logs...</span>
                    ) : (
                        logs.map((log, i) => <div key={i}>{log}</div>)
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
