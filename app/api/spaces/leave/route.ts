import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { spaceId } = body;

        if (!spaceId) {
            return NextResponse.json({ error: 'Space ID is required' }, { status: 400 });
        }

        // Update participant record to set left_at
        const { error } = await supabase
            .from('space_participants')
            .update({
                left_at: new Date().toISOString()
            })
            .eq('space_id', spaceId)
            .eq('user_id', session.user.id);

        if (error) {
            console.error('[Leave Space] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Leave Space] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
