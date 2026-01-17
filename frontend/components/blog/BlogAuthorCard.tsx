import Link from 'next/link';

interface BlogAuthorCardProps {
    author: string;
    description: string;
}

export function BlogAuthorCard({ author, description }: BlogAuthorCardProps) {
    return (
        <div className="bg-[#0d1420] rounded-lg p-6 border-t-4 border-[#c9a962] shadow-xl">
            <div className="flex items-end gap-3 mb-4 -mt-10">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#c9a962] to-[#8c7335] flex items-center justify-center text-[#0a0f1a] font-bold text-2xl shadow-lg ring-4 ring-[#0d1420]">
                    {author[0]}
                </div>
                <div className="mb-1">
                    <h3 className="font-bold text-lg">{author}</h3>
                    <p className="text-xs text-[#f5f0e8]/50 uppercase tracking-wider font-bold">Post Author</p>
                </div>
            </div>
            <p className="text-[#f5f0e8]/80 text-sm leading-relaxed mb-4">
                {description}
            </p>
            <Link
                href="/editor"
                className="block w-full text-center bg-[#1a2333] hover:bg-[#253042] text-[#c9a962] py-2 rounded-md text-sm font-semibold transition-colors"
            >
                Start Creating
            </Link>
        </div>
    );
}
