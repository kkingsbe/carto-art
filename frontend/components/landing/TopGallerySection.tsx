import { getFeed } from '@/lib/actions/feed';
import { TopGalleryCarousel } from './TopGalleryCarousel';
import { Sparkles } from 'lucide-react';

export async function TopGallerySection() {
    const maps = await getFeed('top', 0, 9);

    if (!maps || maps.length === 0) return null;

    return (
        <section className="py-24 relative overflow-hidden bg-[#0a0f1a]">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="container relative mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center text-center space-y-4 mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a962]/10 border border-[#c9a962]/20 text-[#c9a962] text-sm font-medium mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Community Favorites</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white">
                        Top Rated Maps
                    </h2>
                    <p className="max-w-[700px] text-gray-400 md:text-xl">
                        Discover the most loved creations from our community of map artists.
                    </p>
                </div>

                <TopGalleryCarousel maps={maps} />
            </div>
        </section>
    );
}
