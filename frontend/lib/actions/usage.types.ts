// Type definitions for usage tracking - stub for stripped version
export interface ExportUsageResult {
  used: number;
  limit: number;
  allowed: boolean;
  remaining: number;
  nextAvailableAt?: string;
}
