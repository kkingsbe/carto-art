'use client';

interface FeedbackStarRatingProps {
    value: number | null;
    onChange: (value: 1 | 2 | 3 | 4 | 5) => void;
    size?: 'sm' | 'md' | 'lg';
}

const RATING_OPTIONS = [
    { value: 1 as const, emoji: '😞', label: 'Frustrated' },
    { value: 2 as const, emoji: '😕', label: 'Disappointed' },
    { value: 3 as const, emoji: '😐', label: 'Okay' },
    { value: 4 as const, emoji: '🙂', label: 'Good' },
    { value: 5 as const, emoji: '😍', label: 'Love it!' },
];

export function FeedbackStarRating({
    value,
    onChange,
    size = 'md'
}: FeedbackStarRatingProps) {
    const sizeClasses = {
        sm: 'text-2xl gap-2',
        md: 'text-4xl gap-3',
        lg: 'text-5xl gap-4',
    };

    const buttonSizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-14 h-14',
        lg: 'w-18 h-18',
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <div className={`flex items-center ${sizeClasses[size]}`}>
                {RATING_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`
              ${buttonSizeClasses[size]}
              flex items-center justify-center
              rounded-xl transition-all duration-200
              hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-800
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${value === option.value
                                ? 'scale-125 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500'
                                : 'opacity-60 hover:opacity-100'
                            }
            `}
                        aria-label={option.label}
                        title={option.label}
                    >
                        <span className="select-none">{option.emoji}</span>
                    </button>
                ))}
            </div>
            {value && (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium animate-in fade-in duration-200">
                    {RATING_OPTIONS.find(o => o.value === value)?.label}
                </p>
            )}
        </div>
    );
}
