'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Loader2,
    ArrowDown,
    Users,
    Share2,
    Heart,
    ShoppingCart,
    CreditCard,
    CheckCircle2,
    XCircle,
    Store,
    Package,
    Truck,
    MousePointerClick
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FunnelStep {
    step: string;
    count: number;
    percentage: number;
    dropOff: number;
    avgTimeNext?: number;
}

interface StageProps {
    title: string;
    steps: FunnelStep[];
    color: string;
    icon: React.ElementType;
    onStepClick: (step: string) => void;
    selectedStep: string | null;
}

export function FunnelChart() {
    const [data, setData] = useState<FunnelStep[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStep, setSelectedStep] = useState<string | null>(null);

    useEffect(() => {
        const fetchFunnel = async () => {
            try {
                const res = await fetch('/api/admin/stats/funnel');
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to load funnel', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFunnel();
    }, []);

    const stages = useMemo(() => {
        if (!data.length) return null;

        const findStep = (name: string) => data.find(s => s.step === name);

        // Define our stages manually based on the known flow
        const acquisition = [
            findStep('Landing Page'),
            findStep('Editor'),
            findStep('Exported'),
            findStep('Viewed Modal')
        ].filter(Boolean) as FunnelStep[];

        const engagement = [
            findStep('Clicked Donate'),
            findStep('Clicked Share'),
            findStep('Click Purchase')
        ].filter(Boolean) as FunnelStep[];

        const conversion = [
            findStep('Transition Success'),
            findStep('View Store'),
            findStep('View Product'),
            findStep('Size Selected'),
            findStep('Shipping Ent.'),
            findStep('Checkout'),
            findStep('Purchase')
        ].filter(Boolean) as FunnelStep[];

        return { acquisition, engagement, conversion };
    }, [data]);

    if (isLoading) {
        return (
            <div className="h-[600px] flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!stages) return null;

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 h-full overflow-hidden flex flex-col">
            <div className="mb-8">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                    Conversion Funnel
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Visualizing user journey from landing to purchase
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <div className="space-y-12 pb-12">
                    <StageSection
                        title="Acquisition & Activation"
                        steps={stages.acquisition}
                        color="indigo"
                        icon={Users}
                        onStepClick={setSelectedStep}
                        selectedStep={selectedStep}
                    />

                    <div className="relative">
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 to-emerald-200 dark:from-indigo-900 dark:to-emerald-900 -z-10" />

                        <div className="pl-20 pr-4 py-4">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-dashed border-gray-300 dark:border-gray-700">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                                    <MousePointerClick className="w-4 h-4" />
                                    User Intent (Parallel Actions)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {stages.engagement.map((step) => (
                                        <MiniStatCard
                                            key={step.step}
                                            step={step}
                                            icon={getStepIcon(step.step)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <StageSection
                        title="Conversion & Revenue"
                        steps={stages.conversion}
                        color="emerald"
                        icon={CreditCard}
                        onStepClick={setSelectedStep}
                        selectedStep={selectedStep}
                    />
                </div>
            </div>
        </div>
    );
}

function StageSection({
    title,
    steps,
    color,
    icon: Icon,
    onStepClick,
    selectedStep
}: StageProps) {
    return (
        <div className="relative">
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
            </div>

            <div className="space-y-2 relative pl-4">
                {/* Connecting Line */}
                <div className="absolute left-[29px] top-6 bottom-6 w-0.5 bg-gray-100 dark:bg-gray-800" />

                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;
                    const isSelected = selectedStep === step.step;
                    const dropOffRate = index < steps.length - 1 ? steps[index + 1].dropOff : 0;

                    return (
                        <div key={step.step} className="relative group">
                            <motion.div
                                layoutId={step.step}
                                onClick={() => onStepClick(step.step)}
                                className={cn(
                                    "relative z-10 flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer",
                                    isSelected
                                        ? `bg-${color}-50 dark:bg-${color}-900/10 border-${color}-200 dark:border-${color}-800 shadow-sm`
                                        : "bg-white dark:bg-gray-900 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-800"
                                )}
                            >
                                {/* Node Dot */}
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                                    isSelected
                                        ? `bg-${color}-500 border-${color}-600 text-white`
                                        : `bg-white dark:bg-gray-800 border-${color}-200 dark:border-${color}-900 text-gray-500`
                                )}>
                                    {index + 1}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={cn("font-medium text-sm truncate", isSelected ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400")}>
                                            {step.step}
                                        </span>
                                        <span className="font-mono text-sm font-semibold">
                                            {formatNumber(step.count)}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${step.percentage}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={cn("h-full rounded-full", `bg-${color}-500`)}
                                        />
                                    </div>
                                </div>

                                {/* Percentage Badge */}
                                <div className="hidden sm:block text-right min-w-[60px]">
                                    <span className="text-xs font-medium text-gray-500">{step.percentage}%</span>
                                </div>
                            </motion.div>

                            {/* Drop-off Indicator */}
                            {!isLast && dropOffRate > 0 && (
                                <div className="pl-12 py-1 flex items-center">
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-900/20 text-[10px] font-medium text-red-600 dark:text-red-400">
                                        <ArrowDown className="w-3 h-3" />
                                        {dropOffRate}% drop-off
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MiniStatCard({ step, icon: Icon }: { step: FunnelStep, icon: any }) {
    return (
        <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-gray-500">
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <div className="text-xs text-gray-500">{step.step.replace('Clicked ', '')}</div>
                <div className="text-sm font-bold">{formatNumber(step.count)}</div>
            </div>
        </div>
    );
}

function getStepIcon(name: string) {
    if (name.includes('Donate')) return Heart;
    if (name.includes('Share')) return Share2;
    if (name.includes('Purchase')) return ShoppingCart;
    if (name.includes('Store')) return Store;
    if (name.includes('Product')) return Package;
    if (name.includes('Shipping')) return Truck;
    if (name.includes('Checkout')) return CreditCard;
    if (name.includes('Success')) return CheckCircle2;
    if (name.includes('Error')) return XCircle;
    return MousePointerClick;
}

function formatNumber(num: number) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString();
}
