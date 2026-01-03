'use client';

interface CheckboxOption {
    value: string;
    label: string;
    icon?: string;
}

interface FeedbackCheckboxGroupProps {
    options: CheckboxOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    columns?: 1 | 2;
}

export function FeedbackCheckboxGroup({
    options,
    selected,
    onChange,
    columns = 1
}: FeedbackCheckboxGroupProps) {
    const handleToggle = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    return (
        <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => handleToggle(option.value)}
                        className={`
              flex items-center gap-3 px-4 py-3 rounded-xl text-left
              transition-all duration-150
              border-2
              ${isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                            }
            `}
                    >
                        <div className={`
              w-5 h-5 rounded-md border-2 flex items-center justify-center
              transition-all duration-150
              ${isSelected
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }
            `}>
                            {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        {option.icon && <span>{option.icon}</span>}
                        <span className="text-sm font-medium">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
