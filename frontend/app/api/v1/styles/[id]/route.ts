import { NextRequest, NextResponse } from 'next/server';
import { getStyleById } from '@/lib/styles';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const style = getStyleById(id);

    if (!style) {
        return NextResponse.json({ error: 'Style not found' }, { status: 404 });
    }

    // For individual style, we might return more details, but still maybe not the full mapStyle logic
    // as that is dynamic. 

    return NextResponse.json({
        id: style.id,
        name: style.name,
        description: style.description,
        mapStyle: style.mapStyle, // Essential for map rendering in sandbox
        palettes: style.palettes,
        recommendedFonts: style.recommendedFonts,
        layerToggles: style.layerToggles
    });
}
