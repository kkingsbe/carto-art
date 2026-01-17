import Image from 'next/image';

interface BlogPostHeaderProps {
    title: string;
    category: string;
    readTime?: string;
    author: string;
    publishedDate: string;
    heroImage?: string;
    tags?: string[];
}

export function BlogPostHeader({
    title,
    category,
    readTime,
    author,
    publishedDate,
    heroImage,
    tags
}: BlogPostHeaderProps) {
    return (
        <header className="relative w-full rounded-2xl overflow-hidden mb-12 bg-[#0d1420] border border-[#f5f0e8]/10 shadow-2xl group">
            {/* Background Image */}
            {heroImage && (
                <>
                    <Image
                        src={heroImage}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/80 to-transparent" />
                </>
            )}

            {/* Header Content */}
            <div className={`relative z-10 p-6 sm:p-10 md:p-14 flex flex-col justify-end min-h-[400px] ${!heroImage ? 'bg-[#0d1420]' : ''}`}>
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <span className="bg-[#c9a962] text-[#0a0f1a] px-3 py-1 rounded font-bold text-sm uppercase tracking-wide shadow-lg">
                        {category}
                    </span>
                    {readTime && (
                        <span className="bg-[#0a0f1a]/60 backdrop-blur-sm border border-[#f5f0e8]/10 text-[#f5f0e8]/80 px-3 py-1 rounded text-sm font-medium">
                            {readTime}
                        </span>
                    )}
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold mb-6 text-[#f5f0e8] leading-[1.1] tracking-tight drop-shadow-lg">
                    {title}
                </h1>

                <div className="flex items-center gap-6 text-[#f5f0e8]/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a962] to-[#8c7335] flex items-center justify-center text-[#0a0f1a] font-bold shadow-lg ring-2 ring-[#0a0f1a]/50">
                            {author[0]}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-white text-sm">{author}</span>
                            <time dateTime={publishedDate} className="text-xs text-[#f5f0e8]/60">
                                {new Date(publishedDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </time>
                        </div>
                    </div>
                    {tags && tags.length > 0 && (
                        <div className="hidden sm:flex flex-wrap gap-2">
                            {tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-[#c9a962] text-sm font-medium">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
