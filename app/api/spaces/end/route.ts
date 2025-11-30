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

        // Verify user is host
        const { data: space, error: fetchError } = await supabase
            .from('spaces')
            .select('host_id')
            .eq('id', spaceId)
            .single();

        if (fetchError || !space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        if (space.host_id !== session.user.id) {
            return NextResponse.json({ error: 'Only the host can end the space' }, { status: 403 });
        }

        // End the space
        const { error: updateError } = await supabase
            .from('spaces')
            .update({
                is_live: false,
                ended_at: new Date().toISOString()
            })
            .eq('id', spaceId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Optional: Mark all participants as left?
        // For now, we rely on the client to disconnect when they see the space ended event.

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[End Space] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
