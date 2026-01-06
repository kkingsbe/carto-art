import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from current directory (scripts is inside frontend)
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

import { VISTAS } from '../lib/config/vistas';

const VISTAS_TO_SEED = VISTAS;

async function seed() {
    console.log('Seeding vistas...');

    // Clear existing vistas
    const { count } = await supabase.from('vistas').select('*', { count: 'exact', head: true });

    if (count && count > 0) {
        console.log(`Found ${count} vistas. Skipping seed.`);
        return;
    }

    const vistasWithOrder = VISTAS_TO_SEED.map((v: any, i: number) => ({
        ...v,
        display_order: i,
        enabled: true
    }));

    const { data, error } = await supabase
        .from('vistas')
        .insert(vistasWithOrder);

    if (error) {
        console.error('Error seeding vistas:', error);
    } else {
        console.log('Successfully seeded vistas!');
    }
}

seed();
