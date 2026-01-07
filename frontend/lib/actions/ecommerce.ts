'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getSiteConfig } from './usage';
import { CONFIG_KEYS } from './usage.types';
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

    const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return data || [];
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
