import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BLOG_POSTS } from './[slug]/page';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
    title: 'Map Art Blog | Tips, Guides & Inspiration - Carto-Art',
    description: 'Discover tips, guides, and inspiration for creating custom map posters. Learn about wedding map art, home decor ideas, and cartographic design.',
    keywords: 'map art blog, custom poster guides, cartography tips, map design inspiration',
    openGraph: {
        title: 'Carto-Art Blog - Map Art Tips & Inspiration',
        description: 'Guides and inspiration for creating beautiful custom map posters.',
        url: '/blog',
        locale: 'en_US',
        type: 'website',
        images: [
            {
                url: '/hero.jpg',
                width: 1200,
                height: 630,
                alt: 'Carto-Art Blog - Map Art Tips & Inspiration',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Map Art Blog - Carto-Art',
        description: 'Tips, guides, and inspiration for creating beautiful custom map posters.',
        images: ['/hero.jpg'],
    },
};

export default async function BlogIndexPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const blogEnabled = await isFeatureEnabled('blog', user?.id);
    if (!blogEnabled) {
        notFound();
    }

    const posts = Object.values(BLOG_POSTS).sort(
        (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    );

    return (
        <main className="min-h-screen bg-[#0a0f1a] text-[#f5f0e8]">
            {/* Hero */}
            <section className="py-20 px-6 bg-gradient-to-b from-[#c9a962]/10 to-transparent">
                <div className="max-w-6xl mx-auto">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'Blog' }
                        ]}
                        className="mb-8"
                    />

                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Map Art <span className="text-[#c9a962]">Blog</span>
                    </h1>
                    <p className="text-xl text-[#f5f0e8]/80 max-w-2xl">
                        Tips, guides, and inspiration for creating beautiful custom map posters.
                    </p>
                </div>
            </section>

            {/* Posts Grid */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="bg-[#0d1420] rounded-lg overflow-hidden border border-[#c9a962]/20 hover:border-[#c9a962] transition-all hover:transform hover:scale-105"
                            >
                                {post.heroImage && (
                                    <div className="relative aspect-video">
                                        <img
                                            src={post.heroImage}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="flex items-center gap-3 text-sm text-[#f5f0e8]/60 mb-3">
                                        <span className="bg-[#c9a962]/20 text-[#c9a962] px-3 py-1 rounded-full capitalize">
                                            {post.category}
                                        </span>
                                        <time dateTime={post.publishedDate}>
                                            {new Date(post.publishedDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </time>
                                    </div>
                                    <h2 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h2>
                                    <p className="text-[#f5f0e8]/70 text-sm line-clamp-3">{post.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6 bg-gradient-to-b from-transparent to-[#c9a962]/10">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Create Your Map?</h2>
                    <p className="text-xl text-[#f5f0e8]/80 mb-8">
                        Start designing your custom map poster now. Free forever, no signup required.
                    </p>
                    <Link
                        href="/editor"
                        className="inline-block bg-[#c9a962] text-[#0a0f1a] px-10 py-5 rounded-lg font-semibold text-xl hover:bg-[#d4b76e] transition-all transform hover:scale-105"
                    >
                        Open Map Editor →
                    </Link>
                </div>
            </section>
        </main>
    );
}
