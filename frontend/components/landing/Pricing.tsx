'use client';

import { Check, X, Sparkles, Zap, Box, Film, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createCheckoutSession } from '@/lib/actions/subscription';
import { useTransition } from 'react';

// Pricing tiers configuration
const TIERS = [
    {
        name: 'Explorer',
        price: '$0',
        frequency: '/month',
        description: 'Perfect for hobbyists and personal projects.',
        features: [
            { name: 'Access to all map styles', included: true },
            { name: 'Limited daily exports', included: true },
            { name: 'All resolutions (up to 36")', included: true },
            { name: 'Personal license', included: true },
            { name: 'Custom Markers & Routes', included: false },
            { name: '4K Video & GIF Export', included: false },
            { name: 'Cinematic Camera Automations', included: false },
            { name: '3D Model (STL) Export', included: false },
        ],
        cta: 'Start Creating',
        ctaVariant: 'secondary',
        highlighted: false
    },
    {
        name: 'Carto Plus',
        price: '$9',
        frequency: '/month',
        description: 'For power users who need professional tools.',
        features: [
            { name: 'Access to all map styles', included: true },
            { name: 'Unlimited exports', included: true },
            { name: 'All resolutions (up to 36")', included: true },
            { name: 'Commercial license', included: true },
            { name: 'Custom Markers & Routes', included: true },
            { name: '4K Video & GIF Export', included: true },
            { name: 'Cinematic Camera Automations', included: true },
            { name: '3D Model (STL) Export', included: true },
        ],
        cta: 'Upgrade to Plus',
        ctaVariant: 'primary',
        highlighted: true
    }
];

export function Pricing() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleAction = (tierName: string) => {
        if (tierName === 'Carto Plus') {
            startTransition(async () => {
                try {
                    // Pass empty string correctly to createCheckoutSession if needed,
                    // check the signature in subscription.ts. 
                    // The signature is createCheckoutSession(input?: string).
                    // It redirects to session.url.
                    await createCheckoutSession();
                } catch (err) {
                    // If user is not logged in, redirect to login
                    // The action throws 'User not authenticated' if not logged in.
                    // But since this is a client component calling a server action,
                    // catching the error here might not catch the redirect.
                    // However, usually we should check auth on client or handle the error.
                    // For now, let's assume if it fails, we redirect to login.
                    console.error(err);
                    router.push('/login?next=/profile'); // Or wherever appropriate
                }
            });
        } else {
            router.push('/editor');
        }
    };

    return (
        <section className="py-24 bg-[#0a0f1a] relative overflow-hidden" id="pricing">
            {/* Background decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c9a962]/5 rounded-full blur-[120px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-[#f5f0e8] mb-6 tracking-tight">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-lg text-[#d4cfc4]/60 max-w-2xl mx-auto">
                        Start for free, upgrade when you need professional power.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {TIERS.map((tier) => (
                        <div
                            key={tier.name}
                            className={cn(
                                "relative p-8 rounded-3xl border transition-all duration-300",
                                tier.highlighted
                                    ? "bg-gradient-to-br from-[#c9a962]/10 to-[#0a0f1a] border-[#c9a962]/30 hover:border-[#c9a962]/50 shadow-2xl shadow-[#c9a962]/10"
                                    : "glass-card border-white/10 hover:border-white/20"
                            )}
                        >
                            {tier.highlighted && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#c9a962] text-[#0a0f1a] text-sm font-bold rounded-full shadow-lg flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    MOST POPULAR
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-medium text-[#d4cfc4] mb-2">{tier.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-5xl font-bold text-[#f5f0e8]">{tier.price}</span>
                                    <span className="text-[#d4cfc4]/60">{tier.frequency}</span>
                                </div>
                                <p className="text-[#d4cfc4]/70 h-12">{tier.description}</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                {tier.features.map((feature) => (
                                    <div key={feature.name} className="flex items-start gap-3">
                                        {feature.included ? (
                                            <div className={cn(
                                                "mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                                                tier.highlighted ? "bg-[#c9a962] text-[#0a0f1a]" : "bg-white/10 text-white"
                                            )}>
                                                <Check className="w-3 h-3" />
                                            </div>
                                        ) : (
                                            <div className="mt-1 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-white/20">
                                                <X className="w-3 h-3" />
                                            </div>
                                        )}
                                        <span className={cn(
                                            "text-sm",
                                            feature.included ? "text-[#f5f0e8]" : "text-[#d4cfc4]/40"
                                        )}>
                                            {feature.name}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleAction(tier.name)}
                                disabled={isPending && tier.highlighted}
                                className={cn(
                                    "w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2",
                                    tier.highlighted
                                        ? "bg-[#c9a962] text-[#0a0f1a] hover:bg-[#e0c47c] hover:shadow-[0_0_20px_rgba(201,169,98,0.4)]"
                                        : "bg-white/5 text-[#f5f0e8] hover:bg-white/10 border border-white/10",
                                    isPending && tier.highlighted && "opacity-70 cursor-wait"
                                )}
                            >
                                {isPending && tier.highlighted ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        {tier.cta}
                                        {tier.highlighted && <Zap className="w-4 h-4" />}
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
