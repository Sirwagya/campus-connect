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

        // Upsert participant record
        // If they left and are re-joining, we update 'left_at' to null and 'joined_at' to now.
        // Default role is 'listener'.
        const { error } = await supabase
            .from('space_participants')
            .upsert({
                space_id: spaceId,
                user_id: session.user.id,
                role: 'listener', // Always join as listener initially
                joined_at: new Date().toISOString(),
                left_at: null
            }, {
                onConflict: 'space_id,user_id'
            });

        if (error) {
            console.error('[Join Space] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Join Space] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
