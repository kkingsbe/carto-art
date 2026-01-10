import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfileByUsername, getProfileStats } from '@/lib/actions/user';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileMapsGrid } from '@/components/profile/ProfileMapsGrid';
import { Star } from 'lucide-react';
// import { deserializeMapConfig } from '@/lib/supabase/maps'; // Not needed for summary
import { getUserMaps, SavedMapSummary, SavedMap } from '@/lib/actions/maps'; // We'll need a different function for "get public maps by user"
import { ProfileViewTracker } from '@/components/analytics/ProfileViewTracker';
import { ViewTracker } from '@/components/analytics/ViewTracker';

// Helper to fetch public maps for a user
async function getPublicMaps(userId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('maps')
        .select('id, title, subtitle, thumbnail_url, vote_score, view_count, published_at, created_at, updated_at, user_id, is_published')
        .eq('user_id', userId)
        .eq('is_published', true)
        .order('vote_score', { ascending: false })
        .order('published_at', { ascending: false });

    return (data || []) as any[];
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const profile = await getProfileByUsername(username);

    if (!profile) return { title: 'User Not Found' };

    return {
        title: `${profile.display_name || profile.username} | CartoArt`,
        description: `Check out maps created by ${profile.display_name || profile.username}`,
    };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const profile = await getProfileByUsername(username);

    if (!profile) {
        notFound();
    }

    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const [stats, maps] = await Promise.all([
        getProfileStats(profile.id),
        getPublicMaps(profile.id) as Promise<SavedMapSummary[]>
    ]);

    const featuredIds = profile.featured_map_ids || [];
    const featuredMaps = maps.filter(m => featuredIds.includes(m.id));
    // Sort featured maps by the order in featuredIds
    const sortedFeaturedMaps = featuredMaps.sort((a, b) => {
        return featuredIds.indexOf(a.id) - featuredIds.indexOf(b.id);
    });

    const normalMaps = maps.filter(m => !featuredIds.includes(m.id));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            <ViewTracker type="profile" id={profile.id} />
            <ProfileViewTracker targetUserId={profile.id} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ProfileHeader
                    profile={profile}
                    stats={stats}
                    isOwnProfile={currentUser?.id === profile.id}
                />

                {sortedFeaturedMaps.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            Featured Maps
                        </h2>
                        <ProfileMapsGrid maps={sortedFeaturedMaps} profile={profile} />
                    </div>
                )}

                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        All Maps
                    </h2>
                    <ProfileMapsGrid maps={normalMaps.length > 0 ? normalMaps : (sortedFeaturedMaps.length > 0 ? [] : maps)} profile={profile} />
                </div>
            </div>
        </div>
    );
}
