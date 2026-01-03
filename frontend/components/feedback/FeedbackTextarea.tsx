'use client';

interface FeedbackTextareaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
}

export function FeedbackTextarea({
    value,
    onChange,
    placeholder = 'Your feedback helps us improve...',
    maxLength = 1000
}: FeedbackTextareaProps) {
    const charCount = value.length;
    const isNearLimit = charCount > maxLength * 0.8;

    return (
        <div className="space-y-2">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
                placeholder={placeholder}
                rows={4}
                className={`
          w-full px-4 py-3 rounded-xl
          bg-gray-50 dark:bg-gray-800
          border-2 border-gray-200 dark:border-gray-700
          focus:border-blue-500 dark:focus:border-blue-500
          focus:outline-none focus:ring-2 focus:ring-blue-500/20
          text-gray-900 dark:text-gray-100
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          resize-none transition-colors duration-150
        `}
            />
            <div className={`
        text-xs text-right
        transition-colors duration-150
        ${isNearLimit
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-400 dark:text-gray-500'
                }
      `}>
                {charCount}/{maxLength}
            </div>
        </div>
    );
}
