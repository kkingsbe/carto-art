// Feedback system types

export type TriggerType = 'post_export' | 'gallery_browse' | 'profile_setup' | 'return_visit' | 'voluntary';

export interface FeatureRatings {
    ease_of_use?: 1 | 2 | 3;
    map_quality?: 1 | 2 | 3;
    style_options?: 1 | 2 | 3;
    export_quality?: 1 | 2 | 3;
}

export type UseCase =
    | 'gift'
    | 'home_decor'
    | 'wedding_event'
    | 'travel_memory'
    | 'hometown'
    | 'exploring'
    | 'other';

export type PainPoint =
    | 'location_search'
    | 'limited_styles'
    | 'export_quality'
    | 'confusing_interface'
    | 'performance'
    | 'missing_features'
    | 'other';

export interface FeedbackSubmission {
    trigger_type: TriggerType;
    trigger_context?: {
        export_count?: number;
        map_id?: string;
        page_url?: string;
    };
    overall_rating: 1 | 2 | 3 | 4 | 5;
    nps_score?: number; // 0-10
    use_cases?: UseCase[];
    pain_points?: PainPoint[];
    feature_ratings?: FeatureRatings;
    open_feedback?: string;
    allow_followup?: boolean;
}

export interface FeedbackDismissal {
    trigger_type: TriggerType;
    opted_out?: boolean; // If true, don't ask again
}

export interface ShouldShowFeedbackResponse {
    should_show: boolean;
    trigger_type?: TriggerType;
    delay_ms?: number;
}

export interface FeedbackTracking {
    last_prompt_at: string | null;
    last_submitted_at: string | null;
    prompt_count: number;
    dismiss_count: number;
    opted_out: boolean;
}
