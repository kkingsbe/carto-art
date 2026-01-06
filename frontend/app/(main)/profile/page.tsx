import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserMaps, deleteMap, publishMap, unpublishMap } from '@/lib/actions/maps';
import { getProfileStats, type UserProfile } from '@/lib/actions/user';
import { MyMapsList } from '@/components/profile/MyMapsList';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { FeaturedMapsEditor } from '@/components/profile/FeaturedMapsEditor';
import { OrderSuccessToast } from '@/components/ecommerce/OrderSuccessToast';
import { SubscriptionStatusCard } from '@/components/profile/SubscriptionStatusCard';
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Maps List */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#f5f0e8]">my maps</h2>
                  <p className="text-[#d4cfc4] text-sm">Manage your saved designs</p>
                </div>
                <a
                  href={`/user/${typedProfile.username}`}
                  target="_blank"
                  className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
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
            <div className="space-y-8">
              <FeaturedMapsEditor
                allMaps={maps}
                initialFeaturedIds={typedProfile.featured_map_ids || []}
              />

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Public Link
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Share your profile with others
                </p>
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-600 dark:text-gray-300 break-all">
                  {`${SITE_URL || 'https://cartoart.com'}/user/${typedProfile.username}`}
                </div>
              </div>

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

