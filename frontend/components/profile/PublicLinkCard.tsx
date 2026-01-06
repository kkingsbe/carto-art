'use client';

import { Copy, Globe, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface PublicLinkCardProps {
    username: string;
    siteUrl: string;
}

export function PublicLinkCard({ username, siteUrl }: PublicLinkCardProps) {
    const [copied, setCopied] = useState(false);
    const profileUrl = `${siteUrl || 'https://cartoart.com'}/user/${username}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(profileUrl);
            setCopied(true);
            toast.success('Link copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy link');
        }
    };

    return (
        <div className="glass-card rounded-xl p-6 border border-white/5 bg-white/5">
            <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#c9a962]" />
                Public Link
            </h3>
            <p className="text-sm text-[#d4cfc4]/60 mb-4">
                Share your profile with others
            </p>
            <div
                onClick={handleCopy}
                className="group relative flex items-center gap-2 p-3 bg-[#0a0f1a]/50 rounded-lg border border-white/10 hover:border-[#c9a962]/50 hover:bg-[#0a0f1a]/80 transition-all cursor-pointer"
            >
                <div className="text-sm font-mono text-[#d4cfc4] truncate flex-1 selection:bg-[#c9a962]/20">
                    {profileUrl}
                </div>
                <div className="flex-shrink-0 text-[#c9a962] opacity-50 group-hover:opacity-100 transition-opacity">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </div>
            </div>
        </div>
    );
}
