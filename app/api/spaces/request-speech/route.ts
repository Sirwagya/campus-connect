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

        // Create a speaker request
        const { error } = await supabase
            .from('speaker_requests')
            .insert({
                space_id: spaceId,
                user_id: session.user.id,
                status: 'pending'
            });

        if (error) {
            // Ignore duplicate requests (if user clicks multiple times)
            if (error.code === '23505') { // Unique violation
                return NextResponse.json({ success: true, message: 'Request already pending' });
            }
            console.error('[Request Speech] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Request Speech] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
