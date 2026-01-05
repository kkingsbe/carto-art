import { StructuredData } from '@/components/seo/StructuredData';

export function HowToSchema() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.cartoart.net';

    const howToData = {
        name: 'How to Create a Custom Map Poster',
        description: 'Learn how to create beautiful, print-ready map posters of any location using Carto-Art. This free tool lets you customize colors, styles, and export high-resolution images.',
        image: `${baseUrl}/hero.jpg`,
        totalTime: 'PT10M', // 10 minutes
        steps: [
            {
                '@type': 'HowToStep',
                name: 'Search for Your Location',
                text: 'Navigate to the Carto-Art editor and use the search bar to find your desired location. You can search by address, landmark name, city, or coordinates.',
                url: `${baseUrl}/editor`,
                image: `${baseUrl}/hero.jpg`,
            },
            {
                '@type': 'HowToStep',
                name: 'Choose a Map Style',
                text: 'Browse through available map styles in the sidebar. Preview different cartographic styles including standard, satellite, terrain, and artistic themes. Select the style that best fits your aesthetic.',
                url: `${baseUrl}/editor`,
            },
            {
                '@type': 'HowToStep',
                name: 'Customize Colors',
                text: 'Open the color customization panel to adjust individual elements like water, land, roads, buildings, parks, and labels. Create a unique color scheme that matches your decor or personal preference.',
                url: `${baseUrl}/editor`,
            },
            {
                '@type': 'HowToStep',
                name: 'Adjust Typography',
                text: 'Select your preferred font family for labels and text. Choose from modern sans-serif fonts like Inter and Outfit, or classic serif fonts like Playfair Display and EB Garamond.',
                url: `${baseUrl}/editor`,
            },
            {
                '@type': 'HowToStep',
                name: 'Enable 3D Terrain (Optional)',
                text: 'For mountainous or coastal regions, enable 3D terrain visualization. Adjust camera tilt, rotation, and terrain exaggeration to create dramatic topographic effects.',
                url: `${baseUrl}/editor`,
            },
            {
                '@type': 'HowToStep',
                name: 'Export Your Poster',
                text: 'Click the Export button and choose your format (PNG, JPEG, GIF, or Video). Select a resolution preset up to 24×36 inches at 300 DPI for professional print quality. Download your high-resolution file.',
                url: `${baseUrl}/editor`,
            },
            {
                '@type': 'HowToStep',
                name: 'Print Your Map Poster',
                text: 'Take your exported file to a professional printing service or print at home. The 300 DPI resolution ensures crisp, clear prints at large sizes. Frame and display your custom map art.',
                url: `${baseUrl}/blog`,
            },
        ],
    };

    return <StructuredData type="howto" data={howToData} />;
}
