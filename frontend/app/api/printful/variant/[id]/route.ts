import { NextRequest, NextResponse } from 'next/server';
import { printful } from '@/lib/printful/client';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const variantId = parseInt(id, 10);

        if (isNaN(variantId)) {
            return NextResponse.json({ error: 'Invalid variant ID' }, { status: 400 });
        }

        const variantData = await printful.getVariant(variantId);

        // Extract image URL from the variant response
        const imageUrl = variantData?.variant?.image ||
            variantData?.product?.image ||
            null;

        return NextResponse.json({
            variant_id: variantId,
            image_url: imageUrl,
            name: variantData?.variant?.name,
            size: variantData?.variant?.size,
            color: variantData?.variant?.color,
            price: variantData?.variant?.price
        });
    } catch (error: any) {
        console.error('Variant fetch error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch variant' },
            { status: 500 }
        );
    }
}
