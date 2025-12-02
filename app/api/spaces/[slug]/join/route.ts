import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, supabaseAdmin } from '@/lib/supabase-server';
import type { Database } from '@/types/database';

type SpaceMemberInsert = Database['public']['Tables']['space_members']['Insert'];

const buildErrorResponse = (error: unknown, status = 500) => {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status });
};

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { slug } = await params;

        // 1. Get Space ID and details (Use Admin to bypass RLS for private spaces)
        const { data: space, error: spaceError } = await supabaseAdmin
            .from('spaces')
            .select('id, name, is_private, owner_id')
            .eq('slug', slug)
            .single();

        if (spaceError || !space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        // 2. Check if private
        if (space.is_private) {
            // Allow owner to join
            if (space.owner_id === session.user.id) {
                // Proceed to join (owner is allowed)
            } else {
                // Check if already a member
                const { data: membership } = await supabaseAdmin
                    .from('space_members')
                    .select('id')
                    .eq('space_id', space.id)
                    .eq('user_id', session.user.id)
                    .single();

                if (membership) {
                    return NextResponse.json({ message: 'Already a member' }, { status: 200 });
                }

                // Check for valid invite in notifications
                const { data: invite } = await supabaseAdmin
                    .from('notifications')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .eq('type', 'space_invite')
                    .filter('data->>space_id', 'eq', space.id)
                    .single();

                if (!invite) {
                    return NextResponse.json({ error: 'Cannot join private space without an invite' }, { status: 403 });
                }

                // If invite exists, allow joining
            }
        }

        // 3. Join Space (Use Admin to bypass RLS)
        const { error: joinError } = await supabaseAdmin
            .from('space_members')
            .insert({
                space_id: space.id,
                user_id: session.user.id,
                role: 'member'
            } satisfies SpaceMemberInsert);

        if (joinError) {
            if (joinError.code === '23505') { // Unique violation
                return NextResponse.json({ message: 'Already a member' }, { status: 200 });
            }
            return NextResponse.json({ error: joinError.message }, { status: 500 });
        }

        // 4. Increment member count (optional, can be done via trigger)
        // We can ignore the error here if the RPC doesn't exist or fails
        await supabaseAdmin.rpc('increment_space_member_count', { space_id: space.id });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return buildErrorResponse(error);
    }
}
