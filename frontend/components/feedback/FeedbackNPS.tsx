'use client';

interface FeedbackNPSProps {
    value: number | null;
    onChange: (value: number) => void;
}

export function FeedbackNPS({ value, onChange }: FeedbackNPSProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-1">
                {Array.from({ length: 11 }, (_, i) => i).map((num) => (
                    <button
                        key={num}
                        type="button"
                        onClick={() => onChange(num)}
                        className={`
              w-8 h-10 rounded-lg text-sm font-medium
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              ${value === num
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-110'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }
            `}
                    >
                        {num}
                    </button>
                ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                <span>Not at all likely</span>
                <span>Extremely likely</span>
            </div>
        </div>
    );
}
