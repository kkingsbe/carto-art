'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getSiteConfig } from './usage';
import { CONFIG_KEYS } from './usage.types';
import { printful } from '@/lib/printful/client';
import type { Database } from '@/types/database';

export async function uploadDesignFile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
        throw new Error('No valid file provided. Please ensure you are uploading an image.');
    }

    // Limit size (e.g. 50MB)
    if (file.size > 50 * 1024 * 1024) throw new Error('File too large (max 50MB)');

    // Ensure safe buffer conversion
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

    const { error: uploadError } = await supabase.storage
        .from('print-files')
        .upload(fileName, buffer, {
            contentType: file.type || 'image/png',
            upsert: false
        });

    if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Create Signed URL for Printful (valid for 24 hours to ensure fulfillment succeeds even if checkout is slow)
    const { data: signedData, error: signError } = await supabase.storage
        .from('print-files')
        .createSignedUrl(fileName, 86400);

    if (signError || !signedData) {
        throw new Error('Failed to generate secure link');
    }

    return { signedUrl: signedData.signedUrl };
}

export async function getUserOrders() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // 1. Fetch Orders
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    if (!orders || orders.length === 0) return [];

    // 2. Fetch related variants
    const variantIds = Array.from(new Set(orders.map((o: any) => o.variant_id).filter(Boolean)));
    let variantsMap = new Map();

    if (variantIds.length > 0) {
        const { data: variants } = await supabase
            .from('product_variants')
            .select(`
                id,
                name,
                product:products (
                    title
                )
            `)
            .in('id', variantIds);

        if (variants) {
            variantsMap = new Map(variants.map((v: any) => [v.id, v]));
        }
    }

    // Process orders to get fresh signed URLs and flatten structure
    const processedOrders = await Promise.all((orders as any[]).map(async (order) => {
        let thumbnailUrl = null;

        // Check if design_id is a URL from our storage
        // Typical format: .../storage/v1/object/sign/print-files/USER_ID/FILENAME.png?token=...
        if (order.design_id && typeof order.design_id === 'string' && order.design_id.includes('/print-files/')) {
            try {
                // Extract path. We look for the segment after 'print-files/' and before '?'
                // The URL might be URL encoded, so we decode it first just in case, but usually the path parts aren't weirdly encoded.
                const matches = order.design_id.match(/\/print-files\/([^?]+)/);

                if (matches && matches[1]) {
                    const filePath = decodeURIComponent(matches[1]);

                    // Generate a new signed URL valid for 1 hour
                    const { data } = await supabase.storage
                        .from('print-files')
                        .createSignedUrl(filePath, 3600);

                    if (data) {
                        thumbnailUrl = data.signedUrl;
                    }
                }
            } catch (e) {
                console.error('Error regenerating thumbnail for order', order.id, e);
            }
        }
        // Fallback: Check if design_id is a numeric Printful File ID
        else if (order.design_id && /^\d+$/.test(order.design_id as string)) {
            try {
                // It's a Printful File ID, fetch preview from their API
                const fileInfo = await printful.getFile(order.design_id);
                if (fileInfo && fileInfo.preview_url) {
                    thumbnailUrl = fileInfo.preview_url;
                }
            } catch (e) {
                console.warn(`[Orders] Failed to fetch Printful file info for ${order.design_id}`, e);
            }
        }

        // Map variant data
        const variantData = variantsMap.get(order.variant_id);
        const productData = Array.isArray(variantData?.product) ? variantData?.product[0] : variantData?.product;

        const productTitle = productData?.title || 'Custom Map';
        const variantName = variantData?.name || 'Standard';

        // fallback logic: Only use order.design_id if it looks like a URL
        const fallbackUrl = (order.design_id && typeof order.design_id === 'string' && order.design_id.startsWith('http'))
            ? order.design_id
            : null;

        return {
            ...order,
            product_title: productTitle,
            variant_name: variantName,
            thumbnail_url: thumbnailUrl || fallbackUrl
        };
    }));

    return processedOrders;
}

export async function getProductVariants(includeInactive = false) {
    const supabase = await createClient();

    let query = supabase
        .from('product_variants')
        .select('*')
        .order('display_order', { ascending: true });

    if (!includeInactive) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching variants:', error);
        return [];
    }

    return data || [];
}

export async function getImportedProductIds() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('product_variants')
        .select('product_id')
        .returns<{ product_id: number | null }[]>();

    if (error) {
        console.error('Error fetching imported product IDs:', error);
        return [];
    }

    // Return unique non-null IDs
    // data is { product_id: number | null }[]
    const ids = new Set(data.map(d => d.product_id).filter(id => id !== null));
    return Array.from(ids) as number[];
}

export async function upsertProductVariant(variant: {
    id: number;
    product_id?: number;
    name: string;
    price_cents: number;
    is_active?: boolean;
    display_order?: number;
    image_url?: string;
    mockup_template_url?: string | null;
    mockup_print_area?: any;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (!profile?.is_admin) throw new Error('Unauthorized - Admin only');

    const { data, error } = await (supabase as any)
        .from('product_variants')
        .upsert({
            ...variant,
            updated_at: new Date().toISOString()
        } as Database['public']['Tables']['product_variants']['Insert'])
        .select()
        .single();

    if (error) {
        console.error('Upsert variant error:', error);
        throw new Error(error.message);
    }

    return data;
}

export async function upsertProductVariants(variants: {
    id: number;
    product_id?: number;
    name: string;
    price_cents: number;
    is_active?: boolean;
    display_order?: number;
    image_url?: string;
    mockup_template_url?: string | null;
    mockup_print_area?: any;
}[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (!profile?.is_admin) throw new Error('Unauthorized - Admin only');

    if (variants.length === 0) return [];

    const { data, error } = await (supabase as any)
        .from('product_variants')
        .upsert(variants.map(v => ({
            ...v,
            updated_at: new Date().toISOString()
        }) as Database['public']['Tables']['product_variants']['Insert']))
        .select();

    if (error) {
        console.error('Bulk upsert variants error:', error);
        throw new Error(error.message);
    }

    return data;
}

export async function deleteProductVariant(id: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (!profile?.is_admin) throw new Error('Unauthorized - Admin only');

    const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }

    return true;
}

export async function deleteProductVariants(ids: number[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (!profile?.is_admin) throw new Error('Unauthorized - Admin only');

    if (ids.length === 0) return true;

    const { error } = await supabase
        .from('product_variants')
        .delete()
        .in('id', ids);

    if (error) {
        throw new Error(error.message);
    }

    return true;
}

export async function getProducts(includeInactive = false) {
    const supabase = await createClient();

    let query = supabase
        .from('products')
        .select(`
            *,
            variants:product_variants(*)
        `)
        .order('display_order', { ascending: true });

    if (!includeInactive) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return data || [];
}

export async function upsertProduct(product: {
    id: number;
    title: string;
    description?: string;
    features?: string[];
    starting_price?: number;
    display_order?: number;
    is_active?: boolean;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (!profile?.is_admin) throw new Error('Unauthorized - Admin only');

    const { data, error } = await (supabase as any)
        .from('products')
        .upsert({
            ...product,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Upsert product error:', error);
        throw new Error(error.message);
    }

    return data;
}

export async function deleteProduct(id: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (!profile?.is_admin) throw new Error('Unauthorized - Admin only');

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Delete product error:', error);
        throw new Error(error.message);
    }

    return true;
}

/**
 * Get product variants with margin-adjusted display prices
 * Use this for displaying prices to customers
 */
export async function getMarginAdjustedVariants() {
    const [variants, marginPercent] = await Promise.all([
        getProductVariants(),
        getSiteConfig(CONFIG_KEYS.PRODUCT_MARGIN_PERCENT),
    ]);

    return variants.map((v: any) => ({
        ...v,
        display_price_cents: Math.round(v.price_cents * (1 + marginPercent / 100)),
    }));
}

/**
 * Admin: Get all orders with user details
 */
export async function getAdminOrders() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (!profile?.is_admin) throw new Error('Unauthorized - Admin only');

    const { data: orders, error } = await (supabase as any)
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching admin orders:', error);
        throw new Error(error.message);
    }

    if (!orders || orders.length === 0) return [];

    // Manually join profiles since there isn't a direct FK for PostgREST
    const userIds = Array.from(new Set(orders.map((o: any) => o.user_id).filter(Boolean)));

    let profilesMap = new Map();

    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, username')
            .in('id', userIds);

        if (profiles) {
            profilesMap = new Map(profiles.map((p: any) => [p.id, p]));
        }
    }

    return orders.map((o: any) => ({
        ...o,
        user: profilesMap.get(o.user_id) || { display_name: 'Unknown', username: 'unknown' }
    }));
}

/**
 * Admin: Sync order statuses from Printful
 */
export async function syncOrderStatuses() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (!profile?.is_admin) throw new Error('Unauthorized - Admin only');

    // Get active orders
    const { data: orders, error } = await (supabase as any)
        .from('orders')
        .select('id, printful_order_id, status, tracking_url, tracking_number')
        .not('status', 'in', '("fulfilled","failed")')
        .not('printful_order_id', 'is', null);

    if (error) throw new Error(error.message);
    if (!orders || orders.length === 0) return { synced: 0 };

    let syncedCount = 0;

    for (const order of orders) {
        try {
            if (!order.printful_order_id) continue;

            // Fetch from Printful
            const printfulOrder = await printful.getOrder(order.printful_order_id);
            const newStatus = printfulOrder.status;

            // Map Printful status to our status
            // Printful: draft, pending, failed, canceled, inprocess, partial, fulfilled
            // Our: pending, paid, fulfilled, failed
            let mappedStatus = order.status;

            if (newStatus === 'fulfilled') mappedStatus = 'fulfilled';
            else if (newStatus === 'failed' || newStatus === 'canceled') mappedStatus = 'failed';
            else if (newStatus === 'inprocess' || newStatus === 'pending') mappedStatus = 'paid';

            // Extract tracking info
            let trackingUrl = order.tracking_url;
            let trackingNumber = order.tracking_number;

            if (printfulOrder.shipments && printfulOrder.shipments.length > 0) {
                // Use the most recent shipment
                const shipment = printfulOrder.shipments[0];
                if (shipment.tracking_url) trackingUrl = shipment.tracking_url;
                if (shipment.tracking_number) trackingNumber = shipment.tracking_number;
            }

            if (mappedStatus !== order.status || trackingUrl !== order.tracking_url) {
                await (supabase as any)
                    .from('orders')
                    .update({
                        status: mappedStatus,
                        tracking_url: trackingUrl,
                        tracking_number: trackingNumber,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', order.id);
                syncedCount++;
            }
        } catch (e) {
            console.error(`Failed to sync order ${order.id}:`, e);
        }
    }

    return { synced: syncedCount };
}

