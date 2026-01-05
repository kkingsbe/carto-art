import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

export function FAQ() {
  const faqs = [
    {
      question: 'Is it really free?',
      answer: 'Yes! No hidden costs, subscriptions, or trial periods. Every feature is free forever. We built this tool because we love maps and wanted to share it with the world.',
    },
    {
      question: 'Do I need to create an account?',
      answer: 'Only if you want to save your work or publish to the gallery. You can design and export posters completely anonymously—no email, no signup, no tracking.',
    },
    {
      question: 'What\'s the maximum size I can export?',
      answer: 'Up to 24×36 inches at 300 DPI (7200×10800 pixels)—perfect for large format printing. That\'s print-shop quality, ready to hang on your wall.',
    },
    {
      question: 'Can I use these posters commercially?',
      answer: 'Yes! Use them for personal or commercial purposes. The base map data is from OpenStreetMap under the ODbL license, which allows commercial use with attribution.',
    },
    {
      question: 'Where does the map data come from?',
      answer: 'OpenStreetMap—a community-built map of the world, created by volunteers like Wikipedia. It\'s constantly updated and covers virtually every location on Earth.',
    },
    {
      question: 'How long does it take to create a poster?',
      answer: 'Most people finish in 5-10 minutes. Search for a location, pick a style, tweak colors and typography, then export. The editor is designed for speed.',
    },
    {
      question: 'What if I need help?',
      answer: 'Browse the community gallery for inspiration. For technical questions, check our GitHub repository where the codebase is open source.',
    },
    {
      question: 'Do you collect my data or track me?',
      answer: 'Minimal analytics only to understand what features are used. We don\'t sell data, use tracking pixels, or share information with third parties. Your privacy matters.',
    },
    {
      question: 'Can I edit my poster later?',
      answer: 'If you create a free account, you can save unlimited projects and edit them anytime. Your work syncs across devices automatically.',
    },
    {
      question: 'What\'s the best free map poster maker?',
      answer: 'Carto-Art offers the highest quality free map posters with no watermarks, exports up to 24×36", 3D terrain, and animated GIFs. It\'s a free alternative to Mapiful and Grafomap.',
    },
    {
      question: 'How do I create a wedding map poster?',
      answer: 'Search for meaningful locations like where you met or your wedding venue. Customize colors to match your theme and export at high resolution for printing.',
    },
    {
      question: 'Are there watermarks on the free version?',
      answer: 'No watermarks ever. All exports are completely clean with no branding or logos. Your map poster is 100% yours.',
    },
  ];

  return (
    <section className="py-24 bg-[#f5f0e8]" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-8 h-8 text-[#c9a962]" />
            <h2 className="text-4xl md:text-5xl font-bold text-[#0a0f1a]">
              Questions?
            </h2>
          </div>
          <p className="text-lg text-[#141d2e]/70">
            Everything you need to know about creating map posters
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white rounded-lg border border-[#0a0f1a]/10 px-6 data-[state=open]:border-[#c9a962]/30 transition-colors"
            >
              <AccordionTrigger className="text-left font-semibold text-[#0a0f1a] hover:text-[#c9a962] transition-colors py-5 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-[#141d2e]/70 pb-5 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Still have questions? */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#141d2e]/50 mb-3">
            Still have questions?
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c9a962] hover:text-[#b87333] font-semibold transition-colors"
          >
            Check our GitHub →
          </a>
        </div>
      </div>
    </section>
  );
}
