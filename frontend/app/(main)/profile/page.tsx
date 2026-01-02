import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserMaps, deleteMap, publishMap, unpublishMap } from '@/lib/actions/maps';
import { getProfileStats } from '@/lib/actions/user';
import { MyMapsList } from '@/components/profile/MyMapsList';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { FeaturedMapsEditor } from '@/components/profile/FeaturedMapsEditor';
import { SITE_URL } from '@/lib/utils/env';

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

  const [maps, stats] = await Promise.all([
    getUserMaps(),
    getProfileStats(user.id)
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileHeader
          profile={profile}
          stats={stats}
          isOwnProfile={true}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Maps List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">my maps</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your saved designs</p>
              </div>
              <a
                href={`/user/${profile.username}`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
              >
                View Public Profile &rarr;
              </a>
            </div>

            <MyMapsList
              maps={maps}
              userProfile={{
                username: profile.username,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url,
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
              initialFeaturedIds={profile.featured_map_ids || []}
            />

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Public Link
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Share your profile with others
              </p>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-600 dark:text-gray-300 break-all">
                {`${SITE_URL || 'https://cartoart.com'}/user/${profile.username}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

