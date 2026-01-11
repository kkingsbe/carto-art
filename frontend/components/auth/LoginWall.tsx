'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Check } from 'lucide-react';
import { cn, getSessionId } from '@/lib/utils';
import { trackEventAction } from '@/lib/actions/events';

interface LoginWallProps {
    onClose?: () => void;
    title?: string;
    description?: string;
    className?: string;
}

export function LoginWall({
    onClose,
    title = "Unlock More with a Free Account",
    description = "Join thousands of map creators and get immediate access to more features.",
    className
}: LoginWallProps) {
    const router = useRouter();

    // Track login_wall_shown event on mount
    useEffect(() => {
        trackEventAction({
            eventType: 'login_wall_shown',
            eventName: 'login_wall_displayed',
            sessionId: getSessionId(),
            metadata: {
                location: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
            }
        });
    }, []);

    const handleSignUp = () => {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        router.push(`/login?redirect=${returnUrl}`);
    };

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl border border-blue-100 dark:border-blue-900 bg-white dark:bg-gray-800 shadow-sm transition-all",
            "animate-in fade-in zoom-in-95 duration-300",
            className
        )}>
            {/* Gradient Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-50" />

            <div className="relative p-6 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                {title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Benefits List */}
                    <div className="space-y-3 pl-1">
                        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-medium">5 free exports every day</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-medium">Save your maps to cloud</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-medium">Access export history</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <button
                        onClick={handleSignUp}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        Create Free Account
                    </button>
                    <div className="text-center">
                        <button
                            onClick={() => router.push('/login')}
                            className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium"
                        >
                            Already have an account? Sign in
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
