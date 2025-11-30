import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { slug } = await params;

        // 1. Get Space ID and details
        const { data: space, error: spaceError } = await supabase
            .from('spaces')
            .select('id, is_private, owner_id')
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
                const { data: membership } = await supabase
                    .from('space_members')
                    .select('id')
                    .eq('space_id', space.id)
                    .eq('user_id', session.user.id)
                    .single();

                if (membership) {
                    return NextResponse.json({ message: 'Already a member' }, { status: 200 });
                }

                // If not owner and not member, forbid
                // For now, we don't support joining private spaces without an invite code.
                return NextResponse.json({ error: 'Cannot join private space directly' }, { status: 403 });
            }
        }

        // 3. Join Space
        const { error: joinError } = await supabase
            .from('space_members')
            .insert({
                space_id: space.id,
                user_id: session.user.id,
                role: 'member'
            });

        if (joinError) {
            if (joinError.code === '23505') { // Unique violation
                return NextResponse.json({ message: 'Already a member' }, { status: 200 });
            }
            return NextResponse.json({ error: joinError.message }, { status: 500 });
        }

        // 4. Increment member count (optional, can be done via trigger)
        await supabase.rpc('increment_space_member_count', { space_id: space.id });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
