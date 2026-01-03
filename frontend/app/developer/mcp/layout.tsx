import { createClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function McpLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const isEnabled = await isFeatureEnabled('mcp_server', user?.id);

    if (!isEnabled) {
        redirect('/developer');
    }

    return <>{children}</>;
}
