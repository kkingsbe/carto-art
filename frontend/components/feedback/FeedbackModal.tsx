'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedbackStarRating } from './FeedbackStarRating';
import { FeedbackNPS } from './FeedbackNPS';
import { FeedbackCheckboxGroup } from './FeedbackCheckboxGroup';
import { FeedbackRatingGrid } from './FeedbackRatingGrid';
import { FeedbackTextarea } from './FeedbackTextarea';
import type { UseCase, PainPoint, FeatureRatings } from '@/types/feedback';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FeedbackFormData) => Promise<boolean>;
    isSubmitting: boolean;
    onDismiss: (optOut?: boolean) => void;
}

export interface FeedbackFormData {
    overall_rating: 1 | 2 | 3 | 4 | 5;
    nps_score?: number;
    use_cases?: UseCase[];
    pain_points?: PainPoint[];
    feature_ratings?: FeatureRatings;
    open_feedback?: string;
    allow_followup?: boolean;
}

const USE_CASE_OPTIONS = [
    { value: 'gift', label: 'Gift for someone', icon: '🎁' },
    { value: 'home_decor', label: 'Home decor for myself', icon: '🏠' },
    { value: 'wedding_event', label: 'Wedding/Event location', icon: '💒' },
    { value: 'travel_memory', label: 'Travel memory', icon: '✈️' },
    { value: 'hometown', label: 'Hometown / Where I grew up', icon: '🌳' },
    { value: 'exploring', label: 'Just exploring / Testing', icon: '🔍' },
];

const PAIN_POINT_OPTIONS = [
    { value: 'location_search', label: 'Hard to find my location' },
    { value: 'limited_styles', label: 'Limited style/color options' },
    { value: 'export_quality', label: "Export quality wasn't good enough" },
    { value: 'confusing_interface', label: 'Confusing interface' },
    { value: 'performance', label: 'Too slow / performance issues' },
    { value: 'missing_features', label: 'Missing features I expected' },
];

export function FeedbackModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    onDismiss,
}: FeedbackModalProps) {
    // Form state
    const [overallRating, setOverallRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
    const [npsScore, setNpsScore] = useState<number | null>(null);
    const [useCases, setUseCases] = useState<string[]>([]);
    const [painPoints, setPainPoints] = useState<string[]>([]);
    const [featureRatings, setFeatureRatings] = useState<FeatureRatings>({});
    const [openFeedback, setOpenFeedback] = useState('');
    const [allowFollowup, setAllowFollowup] = useState(false);

    // UI state
    const [step, setStep] = useState(1);
    const [showThankYou, setShowThankYou] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setOverallRating(null);
            setNpsScore(null);
            setUseCases([]);
            setPainPoints([]);
            setFeatureRatings({});
            setOpenFeedback('');
            setAllowFollowup(false);
            setStep(1);
            setShowThankYou(false);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!overallRating) return;

        const data: FeedbackFormData = {
            overall_rating: overallRating,
            nps_score: npsScore || undefined,
            use_cases: useCases.length > 0 ? useCases as UseCase[] : undefined,
            pain_points: painPoints.length > 0 ? painPoints as PainPoint[] : undefined,
            feature_ratings: Object.keys(featureRatings).length > 0 ? featureRatings : undefined,
            open_feedback: openFeedback.trim() || undefined,
            allow_followup: allowFollowup,
        };

        const success = await onSubmit(data);
        if (success) {
            setShowThankYou(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        }
    };

    const isPositiveRating = overallRating && overallRating >= 4;
    const canSubmit = overallRating !== null;
    const totalSteps = 2;

    if (!isOpen) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex items-end md:items-center justify-center",
                "animate-in fade-in duration-200",
                "p-0 md:p-4"
            )}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => onDismiss(false)}
            />

            {/* Modal */}
            <div
                className={cn(
                    "relative w-full max-w-md flex flex-col z-10",
                    "bg-white dark:bg-gray-900",
                    "shadow-2xl shadow-blue-500/10",
                    "border border-gray-200 dark:border-gray-800",
                    "rounded-t-2xl md:rounded-2xl overflow-hidden",
                    "animate-in slide-in-from-bottom md:zoom-in-95 duration-300 transform",
                    "pb-safe",
                    "max-h-[85vh]"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Close Button */}
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={() => onDismiss(false)}
                        className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Gradient header */}
                <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-6 text-white relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                    <div className="relative z-10">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <span>✨</span>
                            {showThankYou ? 'Thank you!' : "How's your experience?"}
                        </h2>
                        {!showThankYou && (
                            <p className="text-blue-100 text-sm mt-1">
                                Your feedback helps us improve Carto-Art
                            </p>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-6">
                    {showThankYou ? (
                        <div className="text-center py-8 animate-in zoom-in-50 duration-300">
                            {overallRating && overallRating >= 4 ? (
                                <div className="space-y-6">
                                    <div className="text-6xl mb-2">🎉</div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Glad you enjoyed it!
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                                        Help others discover Carto-Art by sharing your creation.
                                    </p>

                                    <div className="flex justify-center gap-4 pt-2">
                                        <a
                                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Just created a stunning map poster with Carto-Art! 🗺️✨ Check it out:")}&url=${encodeURIComponent("https://carto-art.com")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                                            title="Share on X (Twitter)"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                            </svg>
                                        </a>
                                        <a
                                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://carto-art.com")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                                            title="Share on Facebook"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                            </svg>
                                        </a>
                                        <a
                                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://carto-art.com")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors"
                                            title="Share on LinkedIn"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                                            </svg>
                                        </a>
                                    </div>
                                    <p className="text-xs text-gray-500 pt-4">
                                        We really appreciate your support! ❤️
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="text-6xl mb-2">🙏</div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Thanks for your honesty
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                                        We're better because of feedback like yours. If you shared specific issues, we'll look into them.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : step === 1 ? (
                        <div className="space-y-8">
                            {/* Overall Rating */}
                            <div className="text-center">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                    Rate your overall experience
                                </label>
                                <FeedbackStarRating
                                    value={overallRating}
                                    onChange={setOverallRating}
                                />
                            </div>

                            {/* NPS Score */}
                            {overallRating && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        How likely are you to recommend Carto-Art to a friend?
                                    </label>
                                    <FeedbackNPS
                                        value={npsScore}
                                        onChange={setNpsScore}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                            {/* Use Cases */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    What did you create today? (optional)
                                </label>
                                <FeedbackCheckboxGroup
                                    options={USE_CASE_OPTIONS}
                                    selected={useCases}
                                    onChange={setUseCases}
                                    columns={2}
                                />
                            </div>

                            {/* Conditional: Pain Points or Feature Ratings */}
                            {isPositiveRating ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Rate these aspects (optional)
                                    </label>
                                    <FeedbackRatingGrid
                                        value={featureRatings}
                                        onChange={setFeatureRatings}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        What could we improve? (optional)
                                    </label>
                                    <FeedbackCheckboxGroup
                                        options={PAIN_POINT_OPTIONS}
                                        selected={painPoints}
                                        onChange={setPainPoints}
                                    />
                                </div>
                            )}

                            {/* Open Feedback */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    {isPositiveRating
                                        ? 'What did you love most? Any features you\'d like to see?'
                                        : 'What would have made your experience better?'}
                                </label>
                                <FeedbackTextarea
                                    value={openFeedback}
                                    onChange={setOpenFeedback}
                                    placeholder={isPositiveRating
                                        ? 'Share what you loved or feature ideas...'
                                        : 'Tell us how we can do better...'
                                    }
                                />
                            </div>

                            {/* Follow-up Permission */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={allowFollowup}
                                    onChange={(e) => setAllowFollowup(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                                    May we contact you for follow-up? (email from your account)
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!showThankYou && (
                    <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                        {/* Progress */}
                        <div className="flex justify-center gap-1.5 mb-4">
                            {Array.from({ length: totalSteps }, (_, i) => (
                                <div
                                    key={i}
                                    className={`
                    h-1.5 rounded-full transition-all duration-300
                    ${i + 1 === step
                                            ? 'w-6 bg-blue-500'
                                            : i + 1 < step
                                                ? 'w-3 bg-blue-500'
                                                : 'w-3 bg-gray-300 dark:bg-gray-700'
                                        }
                  `}
                                />
                            ))}
                        </div>

                        <div className="flex gap-3">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="
                    flex-1 px-4 py-3 rounded-xl
                    border-2 border-gray-200 dark:border-gray-700
                    text-gray-700 dark:text-gray-300
                    font-medium
                    hover:bg-gray-100 dark:hover:bg-gray-800
                    transition-colors
                  "
                                >
                                    Back
                                </button>
                            )}

                            {step < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step + 1)}
                                    disabled={!overallRating}
                                    className="
                    flex-1 px-4 py-3 rounded-xl
                    bg-gradient-to-r from-blue-500 to-indigo-600
                    text-white font-medium
                    hover:from-blue-600 hover:to-indigo-700
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all
                  "
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || isSubmitting}
                                    className="
                    flex-1 px-4 py-3 rounded-xl
                    bg-gradient-to-r from-blue-500 to-indigo-600
                    text-white font-medium
                    hover:from-blue-600 hover:to-indigo-700
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all
                    flex items-center justify-center gap-2
                  "
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Feedback'
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Maybe Later link */}
                        <button
                            type="button"
                            onClick={() => onDismiss(false)}
                            className="
                w-full mt-3 text-sm text-gray-500 dark:text-gray-400
                hover:text-gray-700 dark:hover:text-gray-200
                transition-colors
              "
                        >
                            Maybe later
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
