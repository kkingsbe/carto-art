'use client';

import { useState } from 'react';
import { usePlayground, PlaygroundState } from './PlaygroundContext';
import { Button } from '@/components/ui/button';
import { Check, Copy, Terminal, Braces, TerminalSquare as PythonIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Language = 'curl' | 'javascript' | 'python';

const LANGUAGES = [
    { id: 'curl', label: 'cURL', icon: Terminal },
    { id: 'javascript', label: 'Node.js', icon: Braces },
    { id: 'python', label: 'Python', icon: PythonIcon },
];

export function CodeGenerator() {
    const { location, styleId, format, apiKey } = usePlayground();
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<Language>('curl');

    const getSnippet = (lang: Language) => {
        const url = 'https://cartoart.net/api/v1/posters/generate';
        const token = apiKey || 'YOUR_API_KEY';

        const payload = {
            config: {
                location: { center: location.center, zoom: location.zoom },
                style: { id: styleId },
                format: { orientation: format.orientation }
            },
            resolution: { width: format.width, height: format.height }
        };

        const jsonBody = JSON.stringify(payload, null, 2);

        switch (lang) {
            case 'curl':
                return `curl -X POST "${url}" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`;

            case 'javascript':
                return `const response = await fetch('${url}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${token}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${jsonBody})
});

const data = await response.json();
console.log(data);`;

            case 'python':
                return `import requests

url = "${url}"
headers = {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
}
payload = ${JSON.stringify(payload, null, 4)}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getSnippet(activeTab));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-[#0d1117] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/20 border-b border-white/5 shrink-0">
                <div className="flex gap-4">
                    {LANGUAGES.map((lang) => {
                        const Icon = lang.icon;
                        const active = activeTab === lang.id;
                        return (
                            <button
                                key={lang.id}
                                onClick={() => setActiveTab(lang.id as Language)}
                                className={cn(
                                    "flex items-center gap-2 text-xs font-bold transition-all px-1 pb-1 border-b-2",
                                    active
                                        ? "text-[#c9a962] border-[#c9a962]"
                                        : "text-gray-500 border-transparent hover:text-gray-300"
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {lang.label}
                            </button>
                        );
                    })}
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/5 text-gray-400 hover:text-[#c9a962] transition-colors"
                    onClick={handleCopy}
                >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-hidden relative">
                <div className="h-full overflow-auto p-5 dev-scrollbar">
                    <pre className="text-[13px] font-mono leading-relaxed bg-transparent">
                        <code className="text-gray-300 block">
                            {/* Simple Manual Syntax Highlighting logic for common parts */}
                            {getSnippet(activeTab).split('\n').map((line, i) => (
                                <span key={i} className="block group">
                                    <span className="text-gray-600 mr-4 select-none inline-block w-4 text-right">{i + 1}</span>
                                    <span className={cn(
                                        line.includes('curl') || line.includes('import') || line.includes('const') ? "text-purple-400" :
                                            line.includes('fetch') || line.includes('requests') ? "text-blue-400" :
                                                line.includes('http') || line.includes('"') || line.includes("'") ? "text-green-300 opacity-90" :
                                                    "text-gray-300"
                                    )}>
                                        {line.replace(/([0-9.]+)/g, '<span class="text-orange-300">$1</span>').split(/<span class="text-orange-300">|<\/span>/).map((part, pi) =>
                                            pi % 2 === 1 ? <span key={pi} className="text-orange-300">{part}</span> : part
                                        )}
                                    </span>
                                </span>
                            ))}
                        </code>
                    </pre>
                </div>

                {/* Fade at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none" />
            </div>
        </div>
    );
}
