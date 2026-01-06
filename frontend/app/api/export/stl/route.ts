import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { checkExportLimit } from '@/lib/actions/usage';
import { generateStl } from '@/lib/export/stl-generation';
import { createClient } from '@/lib/supabase/server';
import { trackEventAction } from '@/lib/actions/events';
import { logger } from '@/lib/logger';

// Increase max duration for Vercel/Next.js (fetching tiles takes time)
export const maxDuration = 60; // 60 seconds

export async function POST(req: NextRequest) {
    try {
        // 1. Check Feature Flag
        const enabled = await isFeatureEnabled('stl_export');
        if (!enabled) {
            return NextResponse.json({ error: 'Feature disabled' }, { status: 404 });
        }

        // 2. Auth & Limit Check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let subscriptionTier: 'free' | 'carto_plus' = 'free';
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();
            subscriptionTier = profile?.subscription_tier || 'free';
        }

        // Strictly gate to Carto Plus or (optional) allow free tier to try?
        // Plan says: "Strictly gated for Carto Plus users"
        // But let's reuse checkExportLimit logic to be safe/consistent
        const limitCheck = await checkExportLimit(user?.id || null, subscriptionTier);

        if (subscriptionTier !== 'carto_plus') {
            return NextResponse.json(
                { error: 'STL Export requires Carto Plus subscription' },
                { status: 403 }
            );
        }

        // 3. Parse Body
        const body = await req.json();
        const { bounds, resolution, minHeight } = body;

        if (!bounds || bounds.length !== 4) {
            return NextResponse.json({ error: 'Invalid bounds' }, { status: 400 });
        }

        // 4. Generate STL
        logger.info('Generating STL', { userId: user?.id, bounds, resolution });
        const stlBuffer = await generateStl({
            bounds,
            resolution: resolution || 512, // Default to manageable size
            minHeight: minHeight || 2.0
        });

        // 5. Track Usage
        if (user) {
            // Track specialized event
            await trackEventAction({
                userId: user.id,
                eventType: 'poster_export',
                eventName: 'stl_export_generated',
                metadata: {
                    resolution,
                    sizeBytes: stlBuffer.length
                }
            });
        }

        // 6. Return File
        return new NextResponse(stlBuffer, {
            headers: {
                'Content-Type': 'model/stl',
                'Content-Disposition': `attachment; filename="terrain-export.stl"`,
                'Content-Length': stlBuffer.length.toString(),
            },
        });

    } catch (error) {
        logger.error('STL Generation Failed', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
