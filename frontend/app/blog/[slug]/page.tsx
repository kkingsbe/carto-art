import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface BlogPost {
    slug: string;
    title: string;
    description: string;
    content: string;
    publishedDate: string;
    author: string;
    keywords: string[];
    heroImage?: string;
    category: 'guides' | 'inspiration' | 'tips' | 'news';
}

// Blog posts database - in production, this would come from a CMS or database
const BLOG_POSTS: Record<string, BlogPost> = {
    'how-to-create-wedding-map-art': {
        slug: 'how-to-create-wedding-map-art',
        title: 'How to Create Custom Map Art for Your Wedding',
        description: 'A complete guide to designing personalized map posters for your wedding venue, first date location, or proposal spot.',
        publishedDate: '2026-01-05',
        author: 'Carto-Art Team',
        category: 'guides',
        keywords: ['wedding map art', 'custom wedding poster', 'venue map print', 'wedding gift ideas'],
        heroImage: '/examples/washington-artistic-poster.png',
        content: `
# How to Create Custom Map Art for Your Wedding

Wedding map art has become one of the most popular ways to commemorate your special day. Whether you want to showcase your venue, the location of your first date, or where you got engaged, custom map posters make meaningful keepsakes and gifts.

## Why Wedding Map Art?

Custom map posters capture the geography of your love story. They're:
- **Personal**: Every couple's locations are unique
- **Timeless**: Unlike photos, maps have a classic, enduring aesthetic
- **Versatile**: Perfect for home decor, gifts, or wedding signage

## Step 1: Choose Your Location

The most popular wedding map locations include:
- **Venue**: Where you tied the knot
- **Proposal spot**: Where it all began
- **First date**: Your first meeting place
- **Hometown**: Where you both grew up

## Step 2: Select Your Style

Carto-Art offers multiple styles perfect for weddings:
- **Minimal Line Art**: Clean, modern aesthetic
- **Vintage**: Classic, timeless look
- **Artistic**: Watercolor-inspired designs
- **3D Terrain**: For mountain or coastal venues

## Step 3: Customize Colors

Match your wedding colors:
- Use your wedding palette for a cohesive look
- Gold accents for elegant, formal weddings
- Pastels for romantic, soft aesthetics
- Bold colors for modern celebrations

## Step 4: Add Typography

Include meaningful text:
- Venue name and date
- Coordinates of your special place
- "Where we said I do"
- Your names and wedding date

## Step 5: Export and Print

Carto-Art exports at 24×36" print-ready quality with no watermarks. Perfect for:
- Framing as home decor
- Guest book alternative
- Thank you gifts for parents
- Wedding party gifts

## Pro Tips

1. **Order early**: Give yourself time for printing and framing
2. **Match your theme**: Coordinate with your wedding aesthetic
3. **Consider a set**: Create maps of multiple meaningful locations
4. **Gift it**: Parents and wedding party love personalized map art

Ready to create your wedding map? [Start designing now](/editor) - it's completely free!
    `,
    },
    'best-map-poster-ideas-new-home': {
        slug: 'best-map-poster-ideas-new-home',
        title: 'Best Map Poster Ideas for a New Home',
        description: 'Moving into a new home? Discover creative map poster ideas to personalize your space and celebrate your new neighborhood.',
        publishedDate: '2026-01-04',
        author: 'Carto-Art Team',
        category: 'inspiration',
        keywords: ['new home gift', 'housewarming map', 'neighborhood map art', 'moving gift ideas'],
        heroImage: '/examples/salt-lake-city-poster.png',
        content: `
# Best Map Poster Ideas for a New Home

Moving into a new home is exciting! Custom map posters are the perfect way to celebrate your new neighborhood and make your space feel personal from day one.

## Why Map Art for New Homes?

- **Instant personalization**: Make it feel like home immediately
- **Conversation starter**: Guests love asking about your map
- **Neighborhood pride**: Celebrate your new community
- **Thoughtful housewarming gift**: Perfect for friends moving

## Top Map Poster Ideas

### 1. Your New Neighborhood
Zoom into your specific street and surrounding area. Perfect for:
- Entryway or hallway
- Home office
- Kitchen or dining room

### 2. City Overview
Show the entire city with your neighborhood highlighted:
- Great for newcomers to a city
- Shows context of where you live
- Beautiful in living rooms

### 3. Before & After Set
Create two maps:
- Your old neighborhood
- Your new neighborhood
- Display side-by-side to show your journey

### 4. Meaningful Locations Nearby
Highlight:
- Favorite coffee shop
- Local park
- Kids' school
- Nearby trails or beaches

### 5. 3D Terrain View
If you moved to a mountainous or coastal area:
- Showcase dramatic topography
- Perfect for outdoor enthusiasts
- Stunning conversation piece

## Styling Tips

**For Modern Homes**: Minimal line art in black and white or monochrome
**For Traditional Homes**: Vintage style with warm tones
**For Eclectic Spaces**: Bold colors and artistic styles
**For Minimalist Decor**: Clean lines, single accent color

## Where to Hang Your Map

- **Entryway**: Welcome guests with your neighborhood
- **Living Room**: Above the sofa or fireplace
- **Home Office**: Inspire your workspace
- **Bedroom**: Personal touch in private space
- **Hallway**: Fill empty wall space meaningfully

## Housewarming Gift Ideas

Giving a map poster as a housewarming gift? Include:
- The new homeowners' address centered
- Move-in date in the typography
- Coordinates of their new home
- Frame it for extra thoughtfulness

[Create your new home map poster now](/editor) - completely free, no signup required!
    `,
    },
};

export async function generateStaticParams() {
    return Object.keys(BLOG_POSTS).map((slug) => ({
        slug,
    }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const post = BLOG_POSTS[params.slug];

    if (!post) {
        return {
            title: 'Post Not Found - Carto-Art Blog',
        };
    }

    return {
        title: `${post.title} | Carto-Art Blog`,
        description: post.description,
        keywords: post.keywords.join(', '),
        openGraph: {
            title: post.title,
            description: post.description,
            images: post.heroImage ? [post.heroImage] : ['/hero.jpg'],
            type: 'article',
            publishedTime: post.publishedDate,
            authors: [post.author],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.description,
            images: post.heroImage ? [post.heroImage] : ['/hero.jpg'],
        },
    };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const blogEnabled = await isFeatureEnabled('blog', user?.id);
    if (!blogEnabled) {
        notFound();
    }

    const post = BLOG_POSTS[params.slug];

    if (!post) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-[#0a0f1a] text-[#f5f0e8]">
            <article className="max-w-4xl mx-auto px-6 py-16">
                {/* Breadcrumbs */}
                {/* Breadcrumbs */}
                <Breadcrumbs
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Blog', href: '/blog' },
                        { label: post.title }
                    ]}
                    className="mb-8"
                />

                {/* Hero Image */}
                {post.heroImage && (
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
                        <Image
                            src={post.heroImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                )}

                {/* Header */}
                <header className="mb-12">
                    <div className="flex items-center gap-4 text-sm text-[#f5f0e8]/60 mb-4">
                        <span className="bg-[#c9a962]/20 text-[#c9a962] px-3 py-1 rounded-full capitalize">
                            {post.category}
                        </span>
                        <time dateTime={post.publishedDate}>
                            {new Date(post.publishedDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </time>
                        <span>By {post.author}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
                    <p className="text-xl text-[#f5f0e8]/80">{post.description}</p>
                </header>

                {/* Content */}
                <div
                    className="prose prose-invert prose-lg max-w-none
            prose-headings:text-[#f5f0e8] prose-headings:font-bold
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-[#f5f0e8]/90 prose-p:leading-relaxed
            prose-a:text-[#c9a962] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[#f5f0e8] prose-strong:font-semibold
            prose-ul:text-[#f5f0e8]/90 prose-li:my-2
            prose-code:text-[#c9a962] prose-code:bg-[#c9a962]/10 prose-code:px-2 prose-code:py-1 prose-code:rounded"
                    dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
                />

                {/* CTA */}
                <div className="mt-16 p-8 bg-gradient-to-r from-[#c9a962]/10 to-transparent rounded-lg border border-[#c9a962]/20">
                    <h3 className="text-2xl font-bold mb-4">Ready to Create Your Map?</h3>
                    <p className="text-[#f5f0e8]/80 mb-6">
                        Start designing your custom map poster now. Free forever, no signup required.
                    </p>
                    <Link
                        href="/editor"
                        className="inline-block bg-[#c9a962] text-[#0a0f1a] px-8 py-3 rounded-lg font-semibold hover:bg-[#d4b76e] transition-all"
                    >
                        Open Map Editor →
                    </Link>
                </div>
            </article>

            {/* Related Posts */}
            <section className="max-w-4xl mx-auto px-6 py-16 border-t border-[#f5f0e8]/10">
                <h2 className="text-2xl font-bold mb-8">More Articles</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {Object.values(BLOG_POSTS)
                        .filter((p) => p.slug !== params.slug)
                        .slice(0, 2)
                        .map((relatedPost) => (
                            <Link
                                key={relatedPost.slug}
                                href={`/blog/${relatedPost.slug}`}
                                className="bg-[#0d1420] p-6 rounded-lg border border-[#c9a962]/20 hover:border-[#c9a962] transition-colors"
                            >
                                <div className="text-sm text-[#c9a962] mb-2 capitalize">{relatedPost.category}</div>
                                <h3 className="text-xl font-semibold mb-2">{relatedPost.title}</h3>
                                <p className="text-[#f5f0e8]/70 text-sm">{relatedPost.description}</p>
                            </Link>
                        ))}
                </div>
            </section>
        </main>
    );
}

// Export the posts for the blog index
export { BLOG_POSTS };
