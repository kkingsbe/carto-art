import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const PRINTFUL_API_URL = 'https://api.printful.com';
const API_KEY = process.env.PRINTFUL_API_KEY;

const uploadSchema = z.object({
    url: z.string().url(),
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { url } = uploadSchema.parse(body);

        if (!API_KEY) {
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        // Printful "add file" API
        const response = await fetch(`${PRINTFUL_API_URL}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                role: 'printfile',
                url: url,
                filename: `user-${user.id}-${Date.now()}.png`,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json({ error: error.result || 'Printful Upload Failed' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({
            id: data.result.id,
            preview_url: data.result.preview_url
        });

    } catch (error) {
        console.error('Upload Design Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
