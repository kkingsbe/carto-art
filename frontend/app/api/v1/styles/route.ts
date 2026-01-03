import { NextResponse } from 'next/server';
import { styles } from '@/lib/styles';

export async function GET() {
    // Public endpoint, no auth required (or maybe optional auth to see premium styles?)
    // For now, public.

    const availableStyles = styles.map(style => ({
        id: style.id,
        name: style.name,
        description: style.description,
        palettes: style.palettes.map(p => ({
            id: p.id,
            name: p.name,
            colors: {
                background: p.background,
                text: p.text,
                primary: p.primary
            }
        })),
        // Don't return full mapStyle JSON, it's huge. 
        // If user needs full details they can fetch specific style or just use ID.
    }));

    return NextResponse.json({ styles: availableStyles });
}
