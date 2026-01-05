import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.cartoart.net';

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
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
