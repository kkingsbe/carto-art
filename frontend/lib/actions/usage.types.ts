/**
 * Site configuration keys
 */
export const CONFIG_KEYS = {
    FREE_TIER_DAILY_EXPORT_LIMIT: 'free_tier_daily_export_limit',
    FREE_TIER_PROJECT_LIMIT: 'free_tier_project_limit',
    ANON_DAILY_EXPORT_LIMIT: 'anon_daily_export_limit',
} as const;

/**
 * Export usage check result
 */
export interface ExportUsageResult {
    allowed: boolean;
    used: number;
    limit: number;
    remaining: number;
    nextAvailableAt: string | null; // ISO timestamp when oldest export expires
}

/**
 * Project usage check result
 */
export interface ProjectUsageResult {
    allowed: boolean;
    used: number;
    limit: number;
    remaining: number;
}
