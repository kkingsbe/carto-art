import { createClient, SupabaseClient } from '@supabase/supabase-js';

export async function getSupabase(): Promise<SupabaseClient> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase credentials in .env");
    }
    return createClient(supabaseUrl, supabaseKey);
}

export async function inspectTable(table: string, limit: number = 20, json: boolean = false) {
    const supabase = await getSupabase();
    console.log(`Inspecting table: ${table} (Limit: ${limit})`);

    const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(limit);

    if (error) {
        console.error(`Error querying ${table}:`, error.message);
        return;
    }

    if (json) {
        console.log(JSON.stringify(data, null, 2));
    } else {
        if (!data || data.length === 0) {
            console.log("No data found.");
        } else {
            console.table(data);
        }
    }
}

export async function getRow(table: string, id: string | number, json: boolean = false) {
    const supabase = await getSupabase();
    console.log(`Fetching ${table} row with ID: ${id}`);

    const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error(`Error fetching row:`, error.message);
        return;
    }

    if (json) {
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.table([data]); // console.table needs an array to show nicely formatted
    }
}

export async function callRpc(funcName: string, args: Record<string, any> = {}, json: boolean = false) {
    const supabase = await getSupabase();
    console.log(`Calling RPC: ${funcName} with args:`, args);

    const { data, error } = await supabase.rpc(funcName, args);

    if (error) {
        console.error(`Error calling RPC ${funcName}:`, error.message);
        return;
    }

    if (json) {
        console.log(JSON.stringify(data, null, 2));
    } else {
        if (Array.isArray(data)) {
            console.table(data);
        } else if (typeof data === 'object') {
            console.dir(data, { depth: null, colors: true });
        } else {
            console.log(data);
        }
    }
}
