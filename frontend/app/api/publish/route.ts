import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishMap } from '@/lib/actions/maps';
import { uploadThumbnail, deleteThumbnail } from '@/lib/actions/storage';
import { logger } from '@/lib/logger';
import { ServerActionError } from '@/lib/errors/ServerActionError';
import { requireValidOrigin } from '@/lib/middleware/csrf';

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF protection
    try {
      requireValidOrigin(request);
    } catch (error) {
      logger.warn('CSRF protection check failed', { 
        error, 
        path: request.nextUrl.pathname,
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      });
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const mapId = formData.get('mapId') as string;
    const subtitle = formData.get('subtitle') as string | null;
    const thumbnailBlob = formData.get('thumbnail') as File | null;

    if (!mapId) {
      return NextResponse.json(
        { error: 'Map ID is required' },
        { status: 400 }
      );
    }

    let thumbnailUrl: string | null = null;

    try {
      // Upload thumbnail FIRST if provided (fail fast if upload fails)
      if (thumbnailBlob) {
        try {
          thumbnailUrl = await uploadThumbnail(mapId, user.id, thumbnailBlob);
          logger.info('Thumbnail uploaded successfully', { mapId, userId: user.id });
        } catch (error: any) {
          logger.error('Failed to upload thumbnail:', { error, mapId, userId: user.id });
          // Fail fast: don't publish if thumbnail upload fails
          return NextResponse.json(
            { error: `Failed to upload thumbnail: ${error.message || 'Unknown error'}` },
            { status: 500 }
          );
        }
      }

      // Publish the map with thumbnail URL in the same operation (fixes race condition)
      const map = await publishMap(
        mapId,
        subtitle || undefined,
        thumbnailUrl || undefined
      );

      return NextResponse.json({ success: true, map });
    } catch (error: any) {
      // Cleanup thumbnail if publish fails
      if (thumbnailUrl) {
        try {
          await deleteThumbnail(thumbnailUrl);
        } catch (cleanupError: any) {
          logger.error('Failed to cleanup thumbnail after publish failure:', { 
            error: cleanupError, 
            thumbnailUrl, 
            mapId, 
            userId: user.id 
          });
        }
      }
      // Re-throw to be handled by outer catch
      throw error;
    }
  } catch (error: any) {
    logger.error('Publish error:', error);
    
    // Handle ServerActionError with proper status codes
    if (error instanceof ServerActionError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to publish map' },
      { status: 500 }
    );
  }
}

