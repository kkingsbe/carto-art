import fs from 'fs/promises';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Carousel } from '@/components/ui/Carousel';

export interface BlogPost {
    title: string;
    description: string;
    publishedDate: string;
    author: string;
    keywords?: string[];
    heroImage?: string;
    category: 'guides' | 'inspiration' | 'tips' | 'news';
    views?: number;
    readTime?: string;
    tags?: string[];
    // Generated fields
    slug: string;
    content?: any; // The compiled MDX content
}

const BLOG_DIR = path.join(process.cwd(), 'content/blog');


export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
        const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
        const fileContent = await fs.readFile(filePath, 'utf8');

        // Fetch view count
        const supabase = await createClient();
        const { data: stats } = await supabase
            .from('blog_stats')
            .select('view_count')
            .eq('slug', slug)
            .maybeSingle();

        const { frontmatter, content } = await compileMDX<Omit<BlogPost, 'slug' | 'content'>>({
            source: fileContent,
            options: {
                parseFrontmatter: true,
                mdxOptions: {
                    // format: 'mdx', // default
                }
            },
            components: {
                Image,
                Carousel,
                // Add other components here if needed
            }
        });

        // Calculate read time (approx 200 words per minute)
        const words = fileContent.split(/\s+/).length;
        const readTimeMinutes = Math.ceil(words / 200);
        const readTime = `${readTimeMinutes} min read`;

        return {
            slug,
            content,
            ...frontmatter,
            publishedDate: (frontmatter as any).date || frontmatter.publishedDate || new Date().toISOString(),
            keywords: frontmatter.keywords || [],
            views: stats?.view_count || 0,
            readTime,
        };
    } catch (error) {
        console.error(`Error loading post ${slug}:`, error);
        return null; // Return null if file not found or other error
    }
}

export async function getAllPosts(): Promise<BlogPost[]> {
    try {
        const files = await fs.readdir(BLOG_DIR);

        // Fetch specific view counts will be slow if loop, but okay for small blog.
        // Better: fetch all stats once
        const supabase = await createClient();
        const { data: allStats } = await supabase
            .from('blog_stats')
            .select('slug, view_count');

        const statsMap = new Map(allStats?.map(s => [s.slug, s.view_count]) || []);

        const posts = await Promise.all(
            files
                .filter(file => file.endsWith('.mdx'))
                .map(async file => {
                    const slug = file.replace(/\.mdx$/, '');
                    // We can reuse logic or optimize. optimize here since we don't need full compile maybe?
                    // actually existing calls getPostBySlug so it might re-fetch stats one by one.
                    // Let's just let it be efficiently-ish or refactor getPostBySlug to accept pre-fetched views?
                    // For now, let's keep it simple and just let getPostBySlug do its thing, but wait!
                    // Calling getPostBySlug inside getAllPosts causes N+1 DB calls.
                    // Let's refactor getAllPosts to not use getPostBySlug fully or just accept it's slow-ish for now.
                    // Better: manually construct here to avoid DB call per post if we want listing to be fast.
                    // But getPostBySlug does MDX compile too which is the heavy part.

                    // Actually, let's just make getPostBySlug fetch the view count, and getAllPosts will just be slightly slower.
                    // Or, we can inject views if we want.
                    // Let's stick to simplest valid change first: getPostBySlug fetches views. getAllPosts calls getPostBySlug.
                    return getPostBySlug(slug);
                })
        );
        return posts
            .filter((post): post is BlogPost => post !== null)
            .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
    } catch (error) {
        console.error('Error listing posts:', error);
        return [];
    }
}
