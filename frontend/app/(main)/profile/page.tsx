import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserMaps, deleteMap, publishMap, unpublishMap } from '@/lib/actions/maps';
import { getProfileStats, type UserProfile } from '@/lib/actions/user';
import { MyMapsList } from '@/components/profile/MyMapsList';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { FeaturedMapsEditor } from '@/components/profile/FeaturedMapsEditor';
import { PublicLinkCard } from '@/components/profile/PublicLinkCard';
import { OrderSuccessToast } from '@/components/ecommerce/OrderSuccessToast';
import { SubscriptionStatusCard } from '@/components/profile/SubscriptionStatusCard';
import { Map as MapIcon } from 'lucide-react';
import { SITE_URL } from '@/lib/utils/env';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const metadata = {
  title: 'My Maps | CartoArt',
  description: 'View and manage your saved map posters',
};

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/profile');
  }

  // Fetch full profile to get username/featured_maps
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // Should handle error gracefully or redirect
    return <div>Profile not found</div>;
  }

  // TypeScript needs explicit typing for profile after null check
  const typedProfile = profile as unknown as UserProfile;

  const [maps, stats] = await Promise.all([
    getUserMaps(),
    getProfileStats(user.id)
  ]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] pb-20">
      <div className="w-full">
        <OrderSuccessToast />
        <ProfileHeader
          profile={typedProfile}
          stats={stats}
          isOwnProfile={true}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[-4rem] relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content - Maps List */}
            <div className="lg:col-span-8 space-y-8">
              <div className="flex items-end justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#c9a962]/10 flex items-center justify-center border border-[#c9a962]/20">
                    <MapIcon className="w-5 h-5 text-[#c9a962]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#f5f0e8] leading-none mb-1">My Maps</h2>
                    <p className="text-[#d4cfc4]/60 text-sm">Manage your saved designs</p>
                  </div>
                </div>
                <a
                  href={`/user/${typedProfile.username}`}
                  target="_blank"
                  className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-[#c9a962] hover:text-[#d4b472] transition-colors"
                >
                  View Public Profile &rarr;
                </a>
              </div>

              <MyMapsList
                maps={maps}
                userProfile={{
                  username: typedProfile.username,
                  display_name: typedProfile.display_name,
                  avatar_url: typedProfile.avatar_url,
                }}
                onDelete={deleteMap}
                onPublish={publishMap}
                onUnpublish={unpublishMap}
              />
            </div>

            {/* Sidebar - Config */}
            <div className="lg:col-span-4 space-y-6">
              <FeaturedMapsEditor
                allMaps={maps}
                initialFeaturedIds={typedProfile.featured_map_ids || []}
              />

              <PublicLinkCard
                username={typedProfile.username}
                siteUrl={SITE_URL}
              />

              {/* Subscription Management */}
              <SubscriptionStatusCard
                tier={typedProfile.subscription_tier}
                status={typedProfile.subscription_status}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

