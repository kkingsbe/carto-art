import { StructuredData } from '@/components/seo/StructuredData';

export function FAQSchema() {
    const faqData = {
        questions: [
            {
                '@type': 'Question',
                name: 'Is Carto-Art really free?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Carto-Art offers a generous free tier with no hidden costs or trial periods. Core features including map customization and high-resolution image exports are free. Premium features like GIF and video exports are available with Carto Plus subscription. We built this tool because we love maps and wanted to share it with the world.',
                },
            },
            {
                '@type': 'Question',
                name: 'Do I need to create an account to use Carto-Art?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No account is required. You can design and export posters completely anonymously—no email, no signup, no tracking. Accounts are optional and only needed if you want to save your work or publish to the gallery.',
                },
            },
            {
                '@type': 'Question',
                name: 'What is the maximum export size for map posters?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'You can export up to 24×36 inches at 300 DPI (7200×10800 pixels)—perfect for large format printing. That is print-shop quality, ready to hang on your wall.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I use Carto-Art posters commercially?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! Use them for personal or commercial purposes. The base map data is from OpenStreetMap under the ODbL license, which allows commercial use with attribution. Include "© OpenStreetMap contributors" when publishing or selling.',
                },
            },
            {
                '@type': 'Question',
                name: 'Where does the map data come from?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'OpenStreetMap—a community-built map of the world, created by volunteers like Wikipedia. It is constantly updated and covers virtually every location on Earth.',
                },
            },
            {
                '@type': 'Question',
                name: 'How long does it take to create a map poster?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Most people finish in 5-10 minutes. Search for a location, pick a style, tweak colors and typography, then export. The editor is designed for speed and simplicity.',
                },
            },
            {
                '@type': 'Question',
                name: 'Are there watermarks on the exported posters?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No. All exports are completely clean with no branding, watermarks, or logos. Your map poster is 100% yours.',
                },
            },
            {
                '@type': 'Question',
                name: 'What file formats can I export?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'You can export in PNG (recommended for printing), JPEG (smaller file size), GIF (animated orbit), and MP4 (video orbit). PNG format at 300 DPI provides the best print quality.',
                },
            },
            {
                '@type': 'Question',
                name: 'Does Carto-Art collect my data or track me?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'We use minimal analytics only to understand what features are used. We do not sell data, use tracking pixels, or share information with third parties. Your privacy matters, and anonymous usage is fully supported.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I edit my poster later?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'If you create a free account, you can save unlimited projects and edit them anytime. Your work syncs across devices automatically.',
                },
            },
            {
                '@type': 'Question',
                name: 'What is the best free map poster maker?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Carto-Art is a leading free map poster maker with no watermarks, high-resolution exports up to 24×36 inches, 3D terrain visualization, and animated exports. It is a free alternative to paid services like Mapiful and Grafomap.',
                },
            },
            {
                '@type': 'Question',
                name: 'How do I create a wedding map poster?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Use Carto-Art to create custom wedding map posters by searching for meaningful locations like where you met, got engaged, or your wedding venue. Customize colors to match your wedding theme and export at high resolution for printing.',
                },
            },
            {
                '@type': 'Question',
                name: 'What are good housewarming gift ideas with maps?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Create a personalized map poster of the new home address using Carto-Art. Customize the colors to match their decor and export at print-ready quality. It is a thoughtful, unique housewarming gift that celebrates their new beginning.',
                },
            },
        ],
    };

    return <StructuredData type="faq" data={faqData} />;
}
