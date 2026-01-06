import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface LocationData {
    name: string;
    slug: string;
    description: string;
    coordinates: { lat: number; lng: number };
    keywords: string[];
    heroImage?: string;
    facts: string[];
}

const LOCATIONS: Record<string, LocationData> = {
    'new-york': {
        name: 'New York City',
        slug: 'new-york',
        description: 'Create a stunning custom map poster of New York City. Capture the iconic grid of Manhattan, the boroughs, or your favorite NYC neighborhood in beautiful wall art.',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        keywords: ['New York map poster', 'NYC wall art', 'Manhattan map print', 'custom NYC poster'],
        facts: [
            'Manhattan\'s iconic grid system makes for stunning minimalist map art',
            'Capture Central Park, Times Square, or your favorite neighborhood',
            'Perfect gift for NYC natives or anyone who loves the Big Apple',
        ],
        heroImage: '/examples/washington-artistic-poster.png',
    },
    'salt-lake-city': {
        name: 'Salt Lake City',
        slug: 'salt-lake-city',
        description: 'Design a custom Salt Lake City map poster showcasing the beautiful valley surrounded by the Wasatch Mountains. Perfect for outdoor enthusiasts and Utah lovers.',
        coordinates: { lat: 40.7608, lng: -111.8910 },
        keywords: ['Salt Lake City map', 'Utah map poster', 'SLC wall art', 'Wasatch Mountains map'],
        facts: [
            'Showcase the unique grid system with mountain backdrop',
            'Highlight nearby ski resorts and outdoor recreation areas',
            'Celebrate Utah\'s natural beauty in custom wall art',
        ],
        heroImage: '/examples/salt-lake-city-poster.png',
    },
    'mt-fuji': {
        name: 'Mt. Fuji',
        slug: 'mt-fuji',
        description: 'Create breathtaking 3D terrain map art of Mt. Fuji, Japan\'s iconic sacred mountain. Perfect for showcasing the dramatic topography and natural beauty.',
        coordinates: { lat: 35.3606, lng: 138.7278 },
        keywords: ['Mt Fuji map', 'Japan map poster', 'mountain terrain art', '3D topographic map'],
        facts: [
            'Stunning 3D terrain visualization of Japan\'s highest peak',
            'Capture the sacred mountain\'s dramatic elevation',
            'Perfect for adventurers and Japan enthusiasts',
        ],
        heroImage: '/examples/hawaii-poster.png',
    },
    'hawaii': {
        name: 'Hawaii',
        slug: 'hawaii',
        description: 'Design custom map posters of Hawaii\'s beautiful islands. Showcase Oahu, Maui, Kauai, or the Big Island with stunning terrain and coastal features.',
        coordinates: { lat: 21.3099, lng: -157.8581 },
        keywords: ['Hawaii map poster', 'island map art', 'Maui map print', 'Oahu wall art'],
        facts: [
            'Capture the dramatic volcanic terrain and coastlines',
            'Perfect for commemorating your Hawaiian vacation',
            'Showcase individual islands or the entire archipelago',
        ],
        heroImage: '/examples/hawaii-poster.png',
    },
    'denver': {
        name: 'Denver',
        slug: 'denver',
        description: 'Create a custom Denver map poster featuring the Mile High City and the stunning Rocky Mountain backdrop. Perfect for Colorado enthusiasts.',
        coordinates: { lat: 39.7392, lng: -104.9903 },
        keywords: ['Denver map poster', 'Colorado map art', 'Mile High City print', 'Rocky Mountains map'],
        facts: [
            'Showcase Denver\'s grid with the Rocky Mountains backdrop',
            'Highlight your favorite neighborhoods or landmarks',
            'Perfect gift for Colorado natives and mountain lovers',
        ],
        heroImage: '/examples/denver-poster.png',
    },
    'washington-dc': {
        name: 'Washington, DC',
        slug: 'washington-dc',
        description: 'Design a custom Washington DC map poster featuring the nation\'s capital. Capture the National Mall, monuments, and iconic street layout.',
        coordinates: { lat: 38.9072, lng: -77.0369 },
        keywords: ['Washington DC map', 'DC map poster', 'capital city art', 'National Mall map'],
        facts: [
            'Showcase Pierre L\'Enfant\'s iconic diagonal street design',
            'Highlight the National Mall and monuments',
            'Perfect for history buffs and DC residents',
        ],
        heroImage: '/examples/washington-artistic-poster.png',
    },
};

export async function generateStaticParams() {
    return Object.keys(LOCATIONS).map((slug) => ({
        city: slug,
    }));
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
    const location = LOCATIONS[params.city];

    if (!location) {
        return {
            title: 'Location Not Found - Carto-Art',
        };
    }

    return {
        title: `Create a ${location.name} Map Poster | Free Custom Wall Art - Carto-Art`,
        description: location.description,
        keywords: location.keywords.join(', '),
        openGraph: {
            title: `${location.name} Map Poster Maker - Free Custom Wall Art`,
            description: location.description,
            images: location.heroImage ? [location.heroImage] : ['/hero.jpg'],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `Create ${location.name} Map Art - Carto-Art`,
            description: location.description,
            images: location.heroImage ? [location.heroImage] : ['/hero.jpg'],
        },
    };
}

export default function LocationPage({ params }: { params: { city: string } }) {
    const location = LOCATIONS[params.city];

    if (!location) {
        return (
            <div className="min-h-screen bg-[#0a0f1a] text-[#f5f0e8] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Location Not Found</h1>
                    <Link href="/" className="text-[#c9a962] hover:underline">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    const editorUrl = `/editor?lat=${location.coordinates.lat}&lng=${location.coordinates.lng}&zoom=12`;

    return (
        <main className="min-h-screen bg-[#0a0f1a] text-[#f5f0e8]">
            {/* Hero Section */}
            <section className="relative py-20 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#c9a962]/10 to-transparent" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'Locations' },
                            { label: location.name }
                        ]}
                        className="mb-8"
                    />

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                                Create Your <span className="text-[#c9a962]">{location.name}</span> Map Poster
                            </h1>
                            <p className="text-xl text-[#f5f0e8]/80 mb-8">
                                {location.description}
                            </p>
                            <Link
                                href={editorUrl}
                                className="inline-block bg-[#c9a962] text-[#0a0f1a] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#d4b76e] transition-all transform hover:scale-105"
                            >
                                Start Creating →
                            </Link>
                        </div>

                        {location.heroImage && (
                            <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-2xl">
                                <Image
                                    src={location.heroImage}
                                    alt={`${location.name} map poster example`}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Why Create This Map */}
            <section className="py-16 px-6 bg-[#0d1420]">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8">Why Create a {location.name} Map?</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {location.facts.map((fact, index) => (
                            <div key={index} className="bg-[#0a0f1a] p-6 rounded-lg border border-[#c9a962]/20">
                                <div className="text-[#c9a962] text-4xl mb-4">✓</div>
                                <p className="text-[#f5f0e8]/90">{fact}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 text-center">Everything You Need</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-5xl mb-4">🎨</div>
                            <h3 className="font-semibold mb-2">Full Customization</h3>
                            <p className="text-[#f5f0e8]/70 text-sm">Choose colors, styles, and typography</p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl mb-4">🏔️</div>
                            <h3 className="font-semibold mb-2">3D Terrain</h3>
                            <p className="text-[#f5f0e8]/70 text-sm">Visualize elevation and topography</p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl mb-4">🖨️</div>
                            <h3 className="font-semibold mb-2">Print Ready</h3>
                            <p className="text-[#f5f0e8]/70 text-sm">Export at 24×36" poster size</p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl mb-4">✨</div>
                            <h3 className="font-semibold mb-2">No Watermarks</h3>
                            <p className="text-[#f5f0e8]/70 text-sm">100% free, forever</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6 bg-gradient-to-b from-[#c9a962]/10 to-transparent">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Create Your {location.name} Map?</h2>
                    <p className="text-xl text-[#f5f0e8]/80 mb-8">
                        Join thousands of creators making beautiful map art. Free forever, no signup required.
                    </p>
                    <Link
                        href={editorUrl}
                        className="inline-block bg-[#c9a962] text-[#0a0f1a] px-10 py-5 rounded-lg font-semibold text-xl hover:bg-[#d4b76e] transition-all transform hover:scale-105"
                    >
                        Open Map Editor →
                    </Link>
                </div>
            </section>

            {/* Related Locations */}
            <section className="py-16 px-6 bg-[#0d1420]">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold mb-8">Explore Other Locations</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Object.values(LOCATIONS)
                            .filter((loc) => loc.slug !== params.city)
                            .map((loc) => (
                                <Link
                                    key={loc.slug}
                                    href={`/location/${loc.slug}`}
                                    className="bg-[#0a0f1a] p-4 rounded-lg border border-[#c9a962]/20 hover:border-[#c9a962] transition-colors text-center"
                                >
                                    <div className="font-semibold text-sm">{loc.name}</div>
                                </Link>
                            ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
