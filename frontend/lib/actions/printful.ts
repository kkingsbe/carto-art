'use server';

import { printful } from '@/lib/printful/client';
import { createClient } from '@/lib/supabase/server';

export async function searchPrintfulProducts(query: string = '', type: string = '') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check admin
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (error || !profile || !(profile as any).is_admin) throw new Error('Admin only');

    try {
        const products = await printful.getCatalogProducts(query, type);
        return products;
    } catch (error: any) {
        console.error('Printful Search Error:', error);
        throw new Error(error.message || 'Failed to fetch Printful products');
    }
}

export async function getPrintfulProductVariants(productId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check admin
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (error || !profile || !(profile as any).is_admin) throw new Error('Admin only');

    try {
        const product = await printful.getProductVariants(productId);
        return product;
    } catch (error: any) {
        console.error('Printful Variant Fetch Error:', error);
        throw new Error(error.message || 'Failed to fetch variants');
    }
}

export async function syncVariantImages() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (!(profile as any)?.is_admin) throw new Error('Admin only');

    // Get all variants missing an image_url
    const { data: variants, error } = await supabase
        .from('product_variants')
        .select('id')
        .is('image_url', null)
        .returns<{ id: number }[]>();

    if (error) throw error;
    if (!variants || variants.length === 0) return { count: 0 };

    let successCount = 0;
    for (const v of variants) {
        try {
            // Fetch variant info from Printful
            const info = await printful.getVariant(Number(v.id));
            const imageUrl = info?.variant?.image || null;

            if (imageUrl) {
                await (supabase as any)
                    .from('product_variants')
                    .update({ image_url: imageUrl })
                    .eq('id', v.id);
                successCount++;
            }

            // Short delay to be nice to the API
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (e) {
            console.error(`Failed to sync image for variant ${v.id}`, e);
        }
    }

    return { count: successCount };
}
