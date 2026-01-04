import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/auth/api-middleware';
import { createServiceRoleClient } from '@/lib/supabase/server';
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
                bounds: [[mapConfig.location.lng - 0.1, mapConfig.location.lat - 0.1], [mapConfig.location.lng + 0.1, mapConfig.location.lat + 0.1]] // Dummy bounds
            },
            style: {
                id: selectedStyle.id,
                name: selectedStyle.name
            },
            palette: selectedStyle.defaultPalette,
            layers: {
                streets: mapConfig.options.streets,
                buildings: mapConfig.options.buildings,
                water: mapConfig.options.water,
                parks: mapConfig.options.parks,
                labels: mapConfig.options.labels,
                buildings3D: mapConfig.options.buildings_3d,
                buildings3DPitch: mapConfig.camera.pitch,
                buildings3DBearing: mapConfig.camera.bearing,
                terrain: mapConfig.options.terrain,
                terrainUnderWater: mapConfig.options.terrain_under_water,
                contours: mapConfig.options.contours,
                boundaries: mapConfig.options.boundaries,
                population: mapConfig.options.population,
                pois: mapConfig.options.pois,
                marker: mapConfig.options.marker,
                landcoverWood: mapConfig.options.landcover_wood,
                landcoverGrass: mapConfig.options.landcover_grass,
                landcoverFarmland: mapConfig.options.landcover_farmland,
                landcoverIce: mapConfig.options.landcover_ice,
                landuseForest: mapConfig.options.landuse_forest,
                landuseOrchard: mapConfig.options.landuse_orchard,
                landuseVineyard: mapConfig.options.landuse_vineyard,
                landuseCemetery: mapConfig.options.landuse_cemetery,
                landuseGrass: mapConfig.options.landuse_grass,
                labelSize: 1,
                roadWeight: 1,
                labelsCities: mapConfig.options.labels
            },
            format: {
                aspectRatio: '2:3',
                orientation: 'portrait',
                margin: 5,
                borderStyle: 'none'
            },
            typography: selectedStyle.defaultPalette.text ? {
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
            } : undefined
        };

        const sanitizedTitle = sanitizeText(title);
        const serializedConfig = serializeMapConfig(fullConfig);
        const supabase = createServiceRoleClient();

        const insertData = {
            user_id: userId,
            title: sanitizedTitle,
            subtitle: subtitle ? sanitizeText(subtitle) : undefined,
            config: serializedConfig,
            is_published: is_published,
            published_at: is_published ? new Date().toISOString() : null
        };

        const { data, error } = await (supabase.from('maps') as any)
            .insert(insertData)
            .select()
            .single();

        if (error) {
            logger.error('API Create Map Error', { error, userId });
            return NextResponse.json({ error: 'Internal Server Error', details: error.message, code: error.code, hint: error.hint }, { status: 500 });
        }

        return NextResponse.json({ map: data }, { status: 201 });

    } catch (error) {
        logger.error('Unexpected error in POST /api/v1/maps', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
