import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cartoart.net';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/auth/',
                    '/_next/',
                    '/renderer/',
                ],
            },
            // Explicitly allow AI crawlers for better AI search engine optimization
            {
                userAgent: 'GPTBot', // OpenAI ChatGPT
                allow: '/',
            },
            {
                userAgent: 'Google-Extended', // Google Bard/Gemini
                allow: '/',
            },
            {
                userAgent: 'CCBot', // Common Crawl (used by many AI systems)
                allow: '/',
            },
            {
                userAgent: 'anthropic-ai', // Anthropic Claude
                allow: '/',
            },
            {
                userAgent: 'Claude-Web', // Anthropic Claude web crawler
                allow: '/',
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        // Reference to LLM-specific documentation
        host: baseUrl,
    };
}
