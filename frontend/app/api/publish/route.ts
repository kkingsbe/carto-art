import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishMap, updateMapThumbnail } from '@/lib/actions/maps';
import { uploadThumbnail } from '@/lib/actions/storage';

export async function POST(request: NextRequest) {
  try {
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

    // Upload thumbnail if provided
    if (thumbnailBlob) {
      try {
        thumbnailUrl = await uploadThumbnail(mapId, user.id, thumbnailBlob);
      } catch (error) {
        console.error('Failed to upload thumbnail:', error);
        // Continue with publish even if thumbnail upload fails
      }
    }

    // Publish the map
    let map = await publishMap(mapId, subtitle || undefined);

    // Update thumbnail URL if we uploaded one
    if (thumbnailUrl) {
      try {
        map = await updateMapThumbnail(mapId, thumbnailUrl);
      } catch (error) {
        console.error('Failed to update thumbnail URL:', error);
      }
    }

    return NextResponse.json({ success: true, map });
  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish map' },
      { status: 500 }
    );
  }
}

