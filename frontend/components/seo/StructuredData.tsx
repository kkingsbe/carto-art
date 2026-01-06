import Script from 'next/script';

interface StructuredDataProps {
    type?: 'website' | 'software' | 'faq' | 'howto' | 'organization';
    data?: Record<string, any>;
}

export function StructuredData({ type = 'website', data }: StructuredDataProps) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cartoart.net';

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

            case 'howto':
                return {
                    '@context': 'https://schema.org',
                    '@type': 'HowTo',
                    name: data?.name || 'How to Create a Map Poster',
                    description: data?.description || 'Step-by-step guide to creating custom map posters with Carto-Art',
                    image: data?.image || `${baseUrl}/hero.jpg`,
                    totalTime: data?.totalTime || 'PT10M',
                    estimatedCost: {
                        '@type': 'MonetaryAmount',
                        currency: 'USD',
                        value: '0',
                    },
                    tool: {
                        '@type': 'HowToTool',
                        name: 'Carto-Art Map Poster Maker',
                    },
                    step: data?.steps || [],
                };

            case 'organization':
                return {
                    '@context': 'https://schema.org',
                    '@type': 'Organization',
                    name: 'Carto-Art',
                    url: baseUrl,
                    logo: `${baseUrl}/icon.svg`,
                    description: 'Free map poster maker with no watermarks. Create custom wall art from any location.',
                    sameAs: data?.sameAs || [],
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
