import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
    const results: any = {};

    try {
        // 1. Check Columns
        const { data: columns, error: colError } = await supabaseAdmin.rpc('get_columns', { table_name: 'posts' });

        // If RPC doesn't exist (it likely doesn't), use a raw query if possible, 
        // but supabase-js doesn't support raw queries easily without RPC.
        // Let's try to just select one row and see the structure.
        const { data: sample, error: sampleError } = await supabaseAdmin
            .from('posts')
            .select('*')
            .limit(1);

        results.columns_check = {
            sample_data: sample,
            error: sampleError
        };

        // 2. Try a test insert (using a random UUID if we can, or just fail auth if RLS is on? 
        // We are using supabaseAdmin so RLS is bypassed).
        // We need a valid user_id though because of the foreign key constraint.

        // Fetch a user
        const { data: user } = await supabaseAdmin.from('users').select('id').limit(1).single();

        if (user) {
            const { data: insertData, error: insertError } = await supabaseAdmin
                .from('posts')
                .insert({
                    user_id: user.id,
                    content: 'Debug post ' + new Date().toISOString(),
                    attachments: [] // This is the column we are testing
                })
                .select()
                .single();

            results.insert_check = {
                success: !insertError,
                data: insertData,
                error: insertError
            };
        } else {
            results.insert_check = { error: 'No users found to test insert' };
        }

    } catch (e: any) {
        results.unexpected_error = e.message;
    }

    return NextResponse.json(results);
}
