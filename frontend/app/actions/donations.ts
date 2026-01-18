'use server';

import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';

export async function addManualDonation(formData: {
    amount: number;
    currency: string;
    sender_name: string;
    sender_email: string;
    message: string;
    type: string;
    created_at: string;
}) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
        throw new Error('Unauthorized');
    }

    const supabase = await createClient();
    if (!supabase) {
        throw new Error('Supabase client not available');
    }

    const { error } = await (supabase as any).from('donations').insert({
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: formData.amount,
        currency: formData.currency,
        sender_name: formData.sender_name || 'Manual Entry',
        sender_email: formData.sender_email,
        message: formData.message,
        type: formData.type,
        status: 'success',
        created_at: formData.created_at || new Date().toISOString(),
    });

    if (error) {
        console.error('Error inserting manual donation:', error);
        return { error: error.message };
    }

    revalidatePath('/admin');
    return { success: true };
}
