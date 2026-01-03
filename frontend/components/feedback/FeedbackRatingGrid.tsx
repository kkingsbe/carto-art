'use client';

import type { FeatureRatings } from '@/types/feedback';

interface FeatureRatingOption {
    key: keyof FeatureRatings;
    label: string;
}

const FEATURES: FeatureRatingOption[] = [
    { key: 'ease_of_use', label: 'Ease of use' },
    { key: 'map_quality', label: 'Map quality' },
    { key: 'style_options', label: 'Style options' },
    { key: 'export_quality', label: 'Export quality' },
];

const RATING_EMOJIS = [
    { value: 1 as const, emoji: '😞' },
    { value: 2 as const, emoji: '😐' },
    { value: 3 as const, emoji: '😊' },
];

interface FeedbackRatingGridProps {
    value: FeatureRatings;
    onChange: (value: FeatureRatings) => void;
}

export function FeedbackRatingGrid({ value, onChange }: FeedbackRatingGridProps) {
    const handleChange = (feature: keyof FeatureRatings, rating: 1 | 2 | 3) => {
        onChange({
            ...value,
            [feature]: rating,
        });
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-[1fr_repeat(3,48px)] gap-2 items-center">
                <div />
                {RATING_EMOJIS.map((r) => (
                    <div key={r.value} className="text-center text-xl">
                        {r.emoji}
                    </div>
                ))}
            </div>

            {/* Rows */}
            {FEATURES.map((feature) => (
                <div
                    key={feature.key}
                    className="grid grid-cols-[1fr_repeat(3,48px)] gap-2 items-center"
                >
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {feature.label}
                    </span>
                    {RATING_EMOJIS.map((r) => {
                        const isSelected = value[feature.key] === r.value;
                        return (
                            <button
                                key={r.value}
                                type="button"
                                onClick={() => handleChange(feature.key, r.value)}
                                className={`
                  w-12 h-10 rounded-lg
                  transition-all duration-150
                  flex items-center justify-center
                  ${isSelected
                                        ? 'bg-blue-500 ring-2 ring-blue-500 ring-offset-2'
                                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }
                `}
                                aria-label={`Rate ${feature.label} ${r.value} out of 3`}
                            >
                                <div className={`
                  w-3 h-3 rounded-full
                  ${isSelected
                                        ? 'bg-white'
                                        : 'bg-gray-400 dark:bg-gray-600'
                                    }
                `} />
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
