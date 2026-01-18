// Stub Supabase proxy for anonymous mode
// This is a no-op implementation since we're removing Supabase

import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // No-op: just pass through the request
  return NextResponse.next();
}
