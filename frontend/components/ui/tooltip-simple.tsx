'use client';

interface TooltipProps {
    children: React.ReactNode;
    content: string;
    disabled?: boolean;
}

export function Tooltip({ children, content, disabled }: TooltipProps) {
    if (disabled) return <>{children}</>;

    return (
        <span className="group relative inline-block">
            {children}
            <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 top-full mt-1 w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-lg z-50 pointer-events-none">
                {content}
            </span>
        </span>
    );
}
