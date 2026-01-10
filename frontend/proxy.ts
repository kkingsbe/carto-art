import { updateSession } from '@/lib/supabase/proxy';
import { type NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - /admin/featured (exclude high-res upload from middleware limit)
     */
    '/((?!_next/static|_next/image|favicon.ico|admin/featured|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

