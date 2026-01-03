import { HeroClient } from './HeroClient';
import { createClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/feature-flags';

export async function Hero() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const showMcp = await isFeatureEnabled('mcp_server', user?.id);

    return <HeroClient showMcp={showMcp} />;
}
