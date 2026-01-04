
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load from frontend .env if exists. 
// Assuming running from analytics-mcp root, ../frontend/.env is one level up and into frontend
const frontendEnvPath = path.resolve(process.cwd(), '../frontend/.env');
console.error(`Loading env from: ${frontendEnvPath}`);

dotenv.config({ path: frontendEnvPath });
// Also try local .env for override
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase credentials. Make sure SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SERVICE_ROLE_KEY) are set.");
    // We don't exit here to allow the server to start and report error via tool execution if preferred, 
    // but for a critical missing config, exiting or throwing is fine.
    // We'll throw an error when the client is accessed if we want, but let's just log.
}

export const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
