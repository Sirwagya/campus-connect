import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ users: [] });
        }

        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Search users by name or email (if available in public profile)
        // We limit to 5 results for dropdown
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, full_name, email, avatar_url')
            .or(`name.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(5);

        if (error) throw error;

        return NextResponse.json({ users });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
