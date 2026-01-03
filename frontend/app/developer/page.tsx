import { createClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import DeveloperLandingClient from './DeveloperLandingClient';

export default async function DeveloperPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const showMcp = await isFeatureEnabled('mcp_server', user?.id);

    return <DeveloperLandingClient showMcp={showMcp} />;
}
