import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.cartoart.net';

    // Popular location pages
    const locations = [
        'new-york',
        'salt-lake-city',
        'mt-fuji',
        'hawaii',
        'denver',
        'washington-dc',
    ];

    const locationPages = locations.map((location) => ({
        url: `${baseUrl}/map/${location}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/editor`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/gallery`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/developer/docs`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        },
        ...locationPages,
    ];
}
