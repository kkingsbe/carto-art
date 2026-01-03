import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateApiKey } from '@/lib/auth/api-keys';

export async function GET(req: NextRequest) {
    const supabase = createAdminClient();

    // Find first user
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id').limit(1);

    if (pError || !profiles || profiles.length === 0) {
        return NextResponse.json({ error: 'No users found', details: pError }, { status: 500 });
    }

    const userId = (profiles[0] as any).id as string;
    const { apiKey, keyHash } = await generateApiKey();

    const { data: newKey, error: kError } = await (supabase as any)
        .from('api_keys')
        .insert({
            user_id: userId,
            name: 'Automated Test Key',
            key_hash: keyHash,
            key_prefix: apiKey.substring(0, 16),
            tier: 'free',
        })
        .select()
        .single();

    if (kError) {
        return NextResponse.json({ error: 'Failed to create key', details: kError }, { status: 500 });
    }

    return NextResponse.json({
        message: 'Test key created! SAVE THIS NOW.',
        apiKey: apiKey,
        keyRecord: newKey
    });
}
