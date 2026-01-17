import type { Meta, StoryObj } from '@storybook/react';
import Image from 'next/image';
import { ZoomImage } from '@/components/mdx/ZoomImage';

const MarkdownContent = ({ content }: { content: React.ReactNode }) => {
    return (
        <div
            className="prose prose-invert prose-lg md:prose-xl max-w-none
            
            /* Headings Hierarchy */
            prose-headings:font-bold prose-headings:text-[#f5f0e8] prose-headings:tracking-tight
            prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:pb-4 prose-h2:border-b prose-h2:border-[#f5f0e8]/10 prose-h2:font-extrabold
            prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-4 prose-h3:font-bold prose-h3:text-[#f5f0e8]/90
            prose-h4:text-xl prose-h4:mt-8 prose-h4:mb-4 prose-h4:font-semibold prose-h4:text-[#c9a962]
            
            /* Body Text */
            prose-p:text-[#d1d5db] prose-p:leading-8 prose-p:mb-6 prose-p:font-light
            prose-a:text-[#c9a962] prose-a:no-underline hover:prose-a:underline prose-a:font-medium
            prose-strong:text-white prose-strong:font-bold
            
            /* Lists */
            prose-ul:text-[#d1d5db] prose-li:my-2 prose-ul:list-disc prose-ul:pl-6
            prose-ol:text-[#d1d5db] prose-li:my-2 prose-ol:list-decimal prose-ol:pl-6
            
            /* Blockquotes */
            prose-blockquote:border-l-4 prose-blockquote:border-[#c9a962] prose-blockquote:bg-[#1a2333]/50 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:text-xl prose-blockquote:font-medium prose-blockquote:not-italic prose-blockquote:text-[#f5f0e8]
            
            /* Images */
            prose-img:rounded-xl prose-img:shadow-2xl prose-img:my-12 prose-img:border prose-img:border-[#f5f0e8]/10 prose-img:w-full
            
            /* Code */
            prose-code:text-[#c9a962] prose-code:bg-[#1a2333] prose-code:border prose-code:border-[#f5f0e8]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded md:prose-code:text-base prose-code:font-mono"
        >
            {content}
        </div>
    );
};

const meta = {
    title: 'Components/Blog/MarkdownContent',
    component: MarkdownContent,
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof MarkdownContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        content: (
            <>
                <h2>This is an H2 Heading</h2>
                <p>
                    This is a standard paragraph with some <strong>bold text</strong> and some <em>italic text</em>.
                    Here is a <a href="#">link</a> to somewhere.
                </p>

                <h3>This is an H3 Heading</h3>
                <ul>
                    <li>List item one</li>
                    <li>List item two</li>
                    <li>List item three</li>
                </ul>

                <blockquote>
                    "This is a blockquote. It usually contains something important or a quote from someone."
                </blockquote>

                <h4>This is an H4 Heading</h4>
                <ol>
                    <li>First ordered item</li>
                    <li>Second ordered item</li>
                </ol>

                <p>Here is an inline image:</p>
                <ZoomImage
                    src="https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=2574"
                    alt="Sample Image"
                    width={800}
                    height={600}
                />

                <p>And some code:</p>
                <pre>
                    <code>
                        {`const greeting = "Hello World";
console.log(greeting);`}
                    </code>
                </pre>
            </>
        ),
    },
    render: (args) => (
        <div className="max-w-3xl mx-auto bg-[#0a0f1a] p-8">
            <MarkdownContent {...args} />
        </div>
    ),
};
