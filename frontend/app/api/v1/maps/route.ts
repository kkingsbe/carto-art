import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/auth/api-middleware';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { renderMapToBuffer } from '@/lib/rendering/renderer';
import { trackEvent } from '@/lib/events';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { serializeMapConfig } from '@/lib/supabase/maps';
import { sanitizeText } from '@/lib/utils/sanitize';
import { getStyleById, getDefaultStyle } from '@/lib/styles';

const SimplifiedPosterSchema = z.object({
    location: z.object({
        lat: z.number(),
        lng: z.number()
    }),
    style: z.string().optional().default('minimal'),
    text: z.object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
        show_title: z.boolean().default(true),
        show_subtitle: z.boolean().default(true),
        show_coordinates: z.boolean().default(true),
        position: z.enum(['top', 'bottom', 'center']).default('bottom'),
        color: z.string().optional(),
    }).optional(),
    camera: z.object({
        pitch: z.number().min(0).max(60).default(0),
        bearing: z.number().min(0).max(360).default(0),
        zoom: z.number().min(0).max(20).default(12),
    }).optional().default({ pitch: 0, bearing: 0, zoom: 12 }),
    options: z.object({
        // Core Layers
        buildings_3d: z.boolean().default(false),
        high_res: z.boolean().default(false),
        streets: z.boolean().default(true),
        water: z.boolean().default(true),
        parks: z.boolean().default(true),
        buildings: z.boolean().default(true),
        labels: z.boolean().default(true),
        background: z.boolean().default(true),

        // Advanced Layers
        terrain: z.boolean().default(false),
        terrain_under_water: z.boolean().default(false),
        contours: z.boolean().default(false),
        boundaries: z.boolean().default(false),
        population: z.boolean().default(false),
        pois: z.boolean().default(false),
        marker: z.boolean().default(false),

        // Landcover
        landcover_wood: z.boolean().default(false),
        landcover_grass: z.boolean().default(false),
        landcover_farmland: z.boolean().default(false),
        landcover_ice: z.boolean().default(false),

        // Landuse
        landuse_forest: z.boolean().default(false),
        landuse_orchard: z.boolean().default(false),
        landuse_vineyard: z.boolean().default(false),
        landuse_cemetery: z.boolean().default(false),
        landuse_grass: z.boolean().default(false),
    }).optional().default({} as any)
});

const CreateMapSchema = z.object({
    config: SimplifiedPosterSchema,
    title: z.string().min(1, 'Title is required').max(100, 'Title matches max length'),
    subtitle: z.string().optional(),
    is_published: z.boolean().optional().default(false)
});

export async function POST(req: NextRequest) {
    try {
        const authResult = await authenticateApiRequest(req);
        if (!authResult.success) {
            return NextResponse.json(
                { error: authResult.reason === 'rate_limited' ? 'Too Many Requests' : 'Unauthorized', message: authResult.message },
                { status: authResult.reason === 'rate_limited' ? 429 : 401 }
            );
        }
        const { userId } = authResult.context;

        let body;
        try {
            const rawBody = await req.text();
            body = rawBody ? JSON.parse(rawBody) : {};
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const validation = CreateMapSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request', details: validation.error.flatten() }, { status: 400 });
        }

        const { config: mapConfig, title, is_published, subtitle } = validation.data;

        // Map simplified input to full PosterConfig
        const selectedStyle = getStyleById(mapConfig.style) || getDefaultStyle();

        // Determine title defaults if not set in map config (but we have 'title' param)
        const mapTitle = mapConfig.text?.title || title || "New Map";
        const mapSubtitle = mapConfig.text?.subtitle || subtitle || "";

        const fullConfig: any = {
            location: {
                center: [mapConfig.location.lng, mapConfig.location.lat],
                zoom: mapConfig.camera.zoom,
                name: mapTitle,
                city: mapSubtitle,
                bounds: [[mapConfig.location.lng - 0.1, mapConfig.location.lat - 0.1], [mapConfig.location.lng + 0.1, mapConfig.location.lat + 0.1]]
            },
            style: {
                id: selectedStyle.id,
                name: selectedStyle.name,
                description: selectedStyle.description,
                mapStyle: selectedStyle.mapStyle,
                defaultPalette: selectedStyle.defaultPalette,
                palettes: selectedStyle.palettes,
                recommendedFonts: selectedStyle.recommendedFonts,
                layerToggles: selectedStyle.layerToggles
            },
            palette: selectedStyle.defaultPalette,
            layers: {
                streets: mapConfig.options.streets ?? true,
                buildings: mapConfig.options.buildings ?? true,
                water: mapConfig.options.water ?? true,
                parks: mapConfig.options.parks ?? true,
                labels: mapConfig.options.labels ?? true,
                buildings3D: mapConfig.options.buildings_3d ?? false,
                buildings3DPitch: mapConfig.camera.pitch ?? 0,
                buildings3DBearing: mapConfig.camera.bearing ?? 0,
                terrain: mapConfig.options.terrain ?? false,
                terrainUnderWater: mapConfig.options.terrain_under_water ?? false,
                contours: mapConfig.options.contours ?? false,
                boundaries: mapConfig.options.boundaries ?? false,
                population: mapConfig.options.population ?? false,
                pois: mapConfig.options.pois ?? false,
                marker: mapConfig.options.marker ?? false,
                landcoverWood: mapConfig.options.landcover_wood ?? false,
                landcoverGrass: mapConfig.options.landcover_grass ?? false,
                landcoverFarmland: mapConfig.options.landcover_farmland ?? false,
                landcoverIce: mapConfig.options.landcover_ice ?? false,
                landuseForest: mapConfig.options.landuse_forest ?? false,
                landuseOrchard: mapConfig.options.landuse_orchard ?? false,
                landuseVineyard: mapConfig.options.landuse_vineyard ?? false,
                landuseCemetery: mapConfig.options.landuse_cemetery ?? false,
                landuseGrass: mapConfig.options.landuse_grass ?? false,
                labelSize: 1,
                labelMaxWidth: 100,
                roadWeight: 1,
                labelsCities: mapConfig.options.labels ?? true,
                hillshadeExaggeration: 0.5,
                contourDensity: 1
            },
            format: {
                aspectRatio: '2:3',
                orientation: 'portrait',
                margin: 5,
                borderStyle: 'none'
            },
            typography: {
                titleFont: selectedStyle.recommendedFonts?.[0] || 'Inter',
                titleSize: 5,
                titleWeight: 800,
                titleLetterSpacing: 0.08,
                titleAllCaps: true,
                subtitleFont: selectedStyle.recommendedFonts?.[0] || 'Inter',
                subtitleSize: 2.5,
                subtitleWeight: 400,
                subtitleLetterSpacing: 0.2,
                showTitle: mapConfig.text?.show_title ?? true,
                showSubtitle: mapConfig.text?.show_subtitle ?? true,
                showCoordinates: mapConfig.text?.show_coordinates ?? true,
                position: mapConfig.text?.position || 'bottom'
            }
        };

        const sanitizedTitle = sanitizeText(title);
        const sanitizedSubtitle = subtitle ? sanitizeText(subtitle) : null;
        const isPublished = is_published;

        const supabase = createServiceRoleClient();

        // Insert map
        const { data, error } = await (supabase
            .from('maps') as any)
            .insert({
                title: sanitizedTitle,
                subtitle: sanitizedSubtitle,
                config: fullConfig,
                user_id: userId,
                is_published: isPublished,
                published_at: isPublished ? new Date().toISOString() : null,
                thumbnail_url: null,
            })
            .select()
            .single();

        if (error) {
            logger.error('Failed to create map', { error, userId });
            return NextResponse.json({ error: 'Internal Server Error', details: error.message, code: error.code, hint: error.hint }, { status: 500 });
        }

        // Generate Thumbnail in background
        // We don't await this to keep the API responsive, but we start it immediately
        const generateThumbnail = async () => {
            try {
                console.log(`[ThumbnailDebug] Generating thumbnail for map ${data.id}`);
                const thumbnailBuffer = await renderMapToBuffer(fullConfig, {
                    width: 600,
                    height: 900,
                    pixelRatio: 1,
                    timeout: 30000
                });

                const fileName = `thumb-${data.id}-${Date.now()}.png`;
                const filePath = `thumbnails/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('posters')
                    .upload(filePath, thumbnailBuffer, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('posters')
                    .getPublicUrl(filePath);

                await (supabase
                    .from('maps') as any)
                    .update({ thumbnail_url: publicUrl })
                    .eq('id', data.id);

                console.log(`[ThumbnailDebug] Thumbnail generated and updated for map ${data.id}`);
            } catch (err) {
                console.error(`[ThumbnailDebug] Failed to generate thumbnail for map ${data.id}:`, err);
            }
        };

        // Fire and forget - but in some environments (like Vercel) this might be killed
        // For local dev it works fine.
        generateThumbnail();

        // Trace activity
        await trackEvent({
            eventType: 'map_create',
            eventName: 'Map Created via API',
            userId: userId,
            metadata: {
                map_id: data.id,
                title: sanitizedTitle,
                is_published: isPublished,
                source: 'api'
            }
        });

        return NextResponse.json({ map: data }, { status: 201 });

    } catch (error: any) {
        logger.error('Unexpected error in POST /api/v1/maps', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
