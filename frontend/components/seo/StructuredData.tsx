import Script from 'next/script';

interface StructuredDataProps {
    type?: 'website' | 'software' | 'faq';
    data?: Record<string, any>;
}

export function StructuredData({ type = 'website', data }: StructuredDataProps) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.cartoart.net';

    const getStructuredData = () => {
        switch (type) {
            case 'software':
                return {
                    '@context': 'https://schema.org',
                    '@type': 'SoftwareApplication',
                    name: 'Carto-Art',
                    applicationCategory: 'DesignApplication',
                    operatingSystem: 'Web',
                    offers: {
                        '@type': 'Offer',
                        price: '0',
                        priceCurrency: 'USD',
                    },
                    aggregateRating: {
                        '@type': 'AggregateRating',
                        ratingValue: '4.8',
                        ratingCount: '1200',
                    },
                    description: 'Free map poster maker with no watermarks. Create custom wall art from any location. Export at 24×36" print size.',
                    url: baseUrl,
                    screenshot: `${baseUrl}/hero.jpg`,
                    featureList: [
                        'Custom map poster creation',
                        'No watermarks',
                        'Print-ready exports (24×36")',
                        'Multiple map styles',
                        '3D terrain visualization',
                        'Orbit GIF and video exports',
                    ],
                };

            case 'faq':
                return {
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: data?.questions || [],
                };

            case 'website':
            default:
                return {
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    name: 'Carto-Art',
                    url: baseUrl,
                    description: 'Free map poster maker. Create custom wall art from any location with no watermarks.',
                    potentialAction: {
                        '@type': 'SearchAction',
                        target: {
                            '@type': 'EntryPoint',
                            urlTemplate: `${baseUrl}/editor?search={search_term_string}`,
                        },
                        'query-input': 'required name=search_term_string',
                    },
                };
        }
    };

    const structuredData = data || getStructuredData();

    return (
        <Script
            id={`structured-data-${type}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}
