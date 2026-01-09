import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getUserOrders } from '@/lib/actions/ecommerce';
import { OrdersList } from '@/components/ecommerce/OrdersList';
import { getProfileStats, type UserProfile } from '@/lib/actions/user';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { OrderSuccessToast } from '@/components/ecommerce/OrderSuccessToast';

export const metadata = {
    title: 'My Orders | CartoArt',
    description: 'View your order history',
};

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?redirect=/profile/orders');
    }

    const ecommerceEnabled = await isFeatureEnabled('ecommerce', user.id);
    if (!ecommerceEnabled) {
        redirect('/profile');
    }

    // Fetch profile for the header
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile) {
        return <div>Profile not found</div>;
    }

    const [orders, stats] = await Promise.all([
        getUserOrders(),
        getProfileStats(user.id)
    ]);

    // Cast profile to match UserProfile interface if needed
    const typedProfile = profile as unknown as UserProfile;

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
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-[#f5f0e8]">Order History</h2>
                                <p className="text-[#d4cfc4] text-sm">View details of your past orders</p>
                            </div>
                            <a
                                href="/profile"
                                className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                            >
                                &larr; Back to Maps
                            </a>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-1">
                            {/* @ts-ignore - Supabase types mismatch with simpler component types sometimes */}
                            <OrdersList orders={orders} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
