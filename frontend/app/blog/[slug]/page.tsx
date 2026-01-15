import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { createClient } from '@/lib/supabase/server';
import { Eye, ArrowLeft, Share2, Bookmark } from 'lucide-react';
import { getAllPosts, getPostBySlug } from '@/lib/blog/utils';
import { ViewTracker } from '@/components/analytics/ViewTracker';

export async function generateStaticParams() {
    const posts = await getAllPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found - Carto-Art Blog',
        };
    }

    const imageUrl = post.heroImage || '/hero.jpg';

    return {
        title: `${post.title} | Carto-Art Blog`,
        description: post.description,
        keywords: post.keywords?.join(', '),
        openGraph: {
            title: post.title,
            description: post.description,
            url: `/blog/${post.slug}`,
            locale: 'en_US',
            type: 'article',
            publishedTime: post.publishedDate,
            authors: [post.author],
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.description,
            images: [imageUrl],
        },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const blogEnabled = await isFeatureEnabled('blog', user?.id);
    if (!blogEnabled) {
        notFound();
    }

    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const allPosts = await getAllPosts();
    const relatedPosts = allPosts
        .filter((p) => p.slug !== slug)
        .slice(0, 3);

    return (
        <main className="min-h-screen bg-[#0a0f1a] text-[#f5f0e8]">
            <ViewTracker type="blog" id={slug} />

            {/* Layout Container */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 lg:py-12 grid grid-cols-1 lg:grid-cols-[64px_1fr_320px] gap-8 xl:gap-12">

                {/* Left Sidebar (Desktop Actions) */}
                <aside className="hidden lg:flex flex-col gap-8 h-fit sticky top-24">
                    <Link
                        href="/blog"
                        className="w-10 h-10 rounded-full bg-[#1a2333] hover:bg-[#c9a962]/10 hover:text-[#c9a962] flex items-center justify-center transition-colors group"
                        title="Back to Blog"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </Link>

                    <div className="flex flex-col items-center gap-6 mt-4">
                        <div className="flex flex-col items-center gap-2 group cursor-default">
                            <div className="w-10 h-10 rounded-full hover:bg-[#c9a962]/10 flex items-center justify-center transition-colors">
                                <Eye className="w-5 h-5 text-[#f5f0e8]/60 group-hover:text-[#c9a962] transition-colors" />
                            </div>
                            <span className="text-sm font-medium text-[#f5f0e8]/60 group-hover:text-[#c9a962]">
                                {post.views?.toLocaleString()}
                            </span>
                        </div>

                        <button className="w-10 h-10 rounded-full hover:bg-[#c9a962]/10 flex items-center justify-center transition-colors group" title="Share (Coming Soon)">
                            <Share2 className="w-5 h-5 text-[#f5f0e8]/60 group-hover:text-[#c9a962] transition-colors" />
                        </button>

                        <button className="w-10 h-10 rounded-full hover:bg-[#c9a962]/10 flex items-center justify-center transition-colors group" title="Save (Coming Soon)">
                            <Bookmark className="w-5 h-5 text-[#f5f0e8]/60 group-hover:text-[#c9a962] transition-colors" />
                        </button>
                    </div>
                </aside>

                {/* Center Column (Content) */}
                <article className="w-full min-w-0 max-w-3xl mx-auto lg:mx-0">
                    {/* Hero Header */}
                    <header className="relative w-full rounded-2xl overflow-hidden mb-12 bg-[#0d1420] border border-[#f5f0e8]/10 shadow-2xl group">
                        {/* Background Image */}
                        {post.heroImage && (
                            <>
                                <Image
                                    src={post.heroImage}
                                    alt={post.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/80 to-transparent" />
                            </>
                        )}

                        {/* Header Content */}
                        <div className={`relative z-10 p-6 sm:p-10 md:p-14 flex flex-col justify-end min-h-[400px] ${!post.heroImage ? 'bg-[#0d1420]' : ''}`}>
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <span className="bg-[#c9a962] text-[#0a0f1a] px-3 py-1 rounded font-bold text-sm uppercase tracking-wide shadow-lg">
                                    {post.category}
                                </span>
                                {post.readTime && (
                                    <span className="bg-[#0a0f1a]/60 backdrop-blur-sm border border-[#f5f0e8]/10 text-[#f5f0e8]/80 px-3 py-1 rounded text-sm font-medium">
                                        {post.readTime}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold mb-6 text-[#f5f0e8] leading-[1.1] tracking-tight drop-shadow-lg">
                                {post.title}
                            </h1>

                            <div className="flex items-center gap-6 text-[#f5f0e8]/80">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a962] to-[#8c7335] flex items-center justify-center text-[#0a0f1a] font-bold shadow-lg ring-2 ring-[#0a0f1a]/50">
                                        {post.author[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white text-sm">{post.author}</span>
                                        <time dateTime={post.publishedDate} className="text-xs text-[#f5f0e8]/60">
                                            {new Date(post.publishedDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </time>
                                    </div>
                                </div>
                                {post.tags && post.tags.length > 0 && (
                                    <div className="hidden sm:flex flex-wrap gap-2">
                                        {post.tags.slice(0, 3).map((tag) => (
                                            <span key={tag} className="text-[#c9a962] text-sm font-medium">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Content */}
                    <div
                        className="prose prose-invert prose-lg md:prose-xl max-w-none
                        
                        /* Headings Hierarchy */
                        prose-headings:font-bold prose-headings:text-[#f5f0e8] prose-headings:tracking-tight
                        prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:pb-4 prose-h2:border-b prose-h2:border-[#f5f0e8]/10 prose-h2:font-extrabold
                        prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-4 prose-h3:font-bold prose-h3:text-[#f5f0e8]/90
                        prose-h4:text-xl prose-h4:mt-8 prose-h4:mb-4 prose-h4:font-semibold prose-h4:text-[#c9a962]
                        
                        /* Body Text */
                        prose-p:text-[#d1d5db] prose-p:leading-8 prose-p:mb-6 prose-p:font-light
                        prose-a:text-[#c9a962] prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                        prose-strong:text-white prose-strong:font-bold
                        
                        /* Lists */
                        prose-ul:text-[#d1d5db] prose-li:my-2 prose-ul:list-disc prose-ul:pl-6
                        prose-ol:text-[#d1d5db] prose-li:my-2 prose-ol:list-decimal prose-ol:pl-6
                        
                        /* Blockquotes */
                        prose-blockquote:border-l-4 prose-blockquote:border-[#c9a962] prose-blockquote:bg-[#1a2333]/50 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:text-xl prose-blockquote:font-medium prose-blockquote:not-italic prose-blockquote:text-[#f5f0e8]
                        
                        /* Images */
                        prose-img:rounded-xl prose-img:shadow-2xl prose-img:my-12 prose-img:border prose-img:border-[#f5f0e8]/10 prose-img:w-full
                        
                        /* Code */
                        prose-code:text-[#c9a962] prose-code:bg-[#1a2333] prose-code:border prose-code:border-[#f5f0e8]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded md:prose-code:text-base prose-code:font-mono"
                    >
                        {post.content}
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-20 p-10 bg-[#0d1420] rounded-2xl border border-[#c9a962]/20 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#c9a962]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold mb-3 text-[#f5f0e8]">Create your own map art</h3>
                            <p className="text-[#f5f0e8]/70 text-lg">Try our free editor. No signup required.</p>
                        </div>
                        <Link
                            href="/editor"
                            className="relative z-10 bg-[#c9a962] text-[#0a0f1a] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#d4b76e] transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-[#c9a962]/20 whitespace-nowrap"
                        >
                            Open Editor
                        </Link>
                    </div>
                </article>

                {/* Right Sidebar (Desktop) */}
                <aside className="hidden lg:block space-y-8 sticky top-24 h-fit w-full max-w-[320px]">
                    {/* Author Card */}
                    <div className="bg-[#0d1420] rounded-lg p-6 border-t-4 border-[#c9a962] shadow-xl">
                        <div className="flex items-end gap-3 mb-4 -mt-10">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#c9a962] to-[#8c7335] flex items-center justify-center text-[#0a0f1a] font-bold text-2xl shadow-lg ring-4 ring-[#0d1420]">
                                {post.author[0]}
                            </div>
                            <div className="mb-1">
                                <h3 className="font-bold text-lg">{post.author}</h3>
                                <p className="text-xs text-[#f5f0e8]/50 uppercase tracking-wider font-bold">Post Author</p>
                            </div>
                        </div>
                        <p className="text-[#f5f0e8]/80 text-sm leading-relaxed mb-4">
                            Sharing tips and tricks for creating beautiful map posters. Part of the Carto-Art team building the best free map editor on the web.
                        </p>
                        <Link
                            href="/editor"
                            className="block w-full text-center bg-[#1a2333] hover:bg-[#253042] text-[#c9a962] py-2 rounded-md text-sm font-semibold transition-colors"
                        >
                            Start Creating
                        </Link>
                    </div>

                    {/* More Articles */}
                    <div className="bg-[#0d1420] rounded-lg p-5 border border-[#f5f0e8]/10">
                        <h3 className="font-bold text-[#f5f0e8] mb-4 pb-2 border-b border-[#f5f0e8]/10">More from Carto-Art</h3>
                        <div className="space-y-4">
                            {relatedPosts.map(post => (
                                <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                                    <div className="text-xs text-[#f5f0e8]/40 mb-1 group-hover:text-[#c9a962] transition-colors">{post.category}</div>
                                    <h4 className="font-semibold text-[#f5f0e8]/90 group-hover:text-[#c9a962] leading-snug transition-colors">
                                        {post.title}
                                    </h4>
                                </Link>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Mobile Footer Nav (optional, for back button if needed) */}
            <div className="lg:hidden fixed bottom-6 right-6 z-50">
                <Link href="/blog" className="w-12 h-12 rounded-full bg-[#c9a962] text-[#0a0f1a] flex items-center justify-center shadow-2xl">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
            </div>
        </main>
    );
}
