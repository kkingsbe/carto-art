'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

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

    // Create Signed URL for Printful (valid for 1 hour)
    const { data: signedData, error: signError } = await supabase.storage
        .from('print-files')
        .createSignedUrl(fileName, 3600);

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
