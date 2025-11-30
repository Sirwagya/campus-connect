import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, isRecorded } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // 1. Create the space
        const { data: space, error: spaceError } = await supabase
            .from('spaces')
            .insert({
                host_id: session.user.id,
                title,
                description,
                is_recorded: isRecorded || false,
                is_live: true,
                started_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (spaceError) {
            console.error('[Create Space] Error creating space:', spaceError);
            return NextResponse.json({ error: spaceError.message }, { status: 500 });
        }

        // 2. Add host as a participant (role: host)
        // We use supabaseAdmin to bypass RLS if needed, though the host policy should allow it.
        // Using admin ensures it definitely works.
        const { error: participantError } = await supabaseAdmin
            .from('space_participants')
            .insert({
                space_id: space.id,
                user_id: session.user.id,
                role: 'host',
                joined_at: new Date().toISOString(),
            });

        if (participantError) {
            console.error('[Create Space] Error adding host:', participantError);
            // Cleanup space if participant creation fails? 
            // For now, just return error, but ideally we'd rollback.
            return NextResponse.json({ error: participantError.message }, { status: 500 });
        }

        return NextResponse.json({ space });
    } catch (error: any) {
        console.error('[Create Space] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
