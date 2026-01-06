import Link from 'next/link';
import { Fragment } from 'react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
    return (
        <nav className={`text-sm text-[#f5f0e8]/60 ${className}`}>
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <Fragment key={index}>
                        {index > 0 && <span className="mx-2">/</span>}
                        {item.href && !isLast ? (
                            <Link
                                href={item.href}
                                className="hover:text-[#c9a962] transition-colors"
                                title={item.label}
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className={`text-[#f5f0e8] ${isLast ? 'font-medium' : ''}`}>
                                {item.label}
                            </span>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}
