// Stub file for usage tracking - no-op for anonymous version
import type { ExportUsageResult } from './usage.types';

export async function checkExportUsage(): Promise<ExportUsageResult> {
  // Always allow unlimited exports for anonymous version
  return {
    used: 0,
    limit: Infinity,
    allowed: true,
    remaining: Infinity,
  };
}

// Re-export the type for convenience
export type { ExportUsageResult } from './usage.types';
