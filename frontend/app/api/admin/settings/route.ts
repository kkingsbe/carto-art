import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/settings
 * Fetch all site configuration values
 */
export async function GET() {
    const supabase = await createClient();

    // Check admin status
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all config values
    const { data: configs, error } = await (supabase as any)
        .from('site_config')
        .select('*')
        .order('key');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ configs });
}

/**
 * PATCH /api/admin/settings
 * Update a site configuration value
 */
export async function PATCH(req: Request) {
    const supabase = await createClient();

    // Check admin status
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
        return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    // Update or insert the config value
    const { data, error } = await (supabase as any)
        .from('site_config')
        .upsert({
            key,
            value,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data });
}

