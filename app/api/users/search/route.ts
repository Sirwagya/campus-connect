import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let queryBuilder = supabase
            .from('users')
            .select('id, name, full_name, email, avatar_url');

        if (query && query.length >= 1) {
            queryBuilder = queryBuilder.or(`name.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`);
        } else {
            // Return recent users if no query
            queryBuilder = queryBuilder.order('created_at', { ascending: false });
        }

        const { data: users, error } = await queryBuilder.limit(5);

        if (error) throw error;

        return NextResponse.json({ users });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
