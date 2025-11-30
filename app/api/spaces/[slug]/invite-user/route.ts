import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 1. Get Space Details
        const { data: space } = await supabase
            .from('spaces')
            .select('id, name, is_private, owner_id')
            .eq('slug', slug)
            .single();

        if (!space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        // 2. Check Permissions (Owner/Mod only)
        const { data: membership } = await supabase
            .from('space_members')
            .select('role')
            .eq('space_id', space.id)
            .eq('user_id', session.user.id)
            .single();

        if (!membership || (membership.role !== 'owner' && membership.role !== 'moderator')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Find User by Email
        // Note: We need to search the 'users' table (public profile)
        // Assuming 'email' is in the users table or we have a way to look it up.
        // If 'users' table doesn't have email (it usually doesn't for privacy), we might need to rely on exact match if we stored it,
        // OR we might need to use an RPC function if we want to lookup by auth.users email (admin only).
        // For this hackathon, let's assume the 'users' table has an 'email' column or we added it.
        // If not, we'll try to match by 'name' or 'full_name' as a fallback, or ask user to provide username.
        // Let's check if 'users' has email. If not, we might need to add it or use username.

        // Let's try to find by email in public.users first.
        let { data: targetUser } = await supabase
            .from('users')
            .select('id, name')
            .eq('email', email)
            .single();

        if (!targetUser) {
            // Fallback: Try to find by username (name)
            const { data: targetUserByName } = await supabase
                .from('users')
                .select('id, name')
                .eq('name', email) // Treating input as username
                .single();

            targetUser = targetUserByName;
        }

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 4. Check if already a member
        const { data: existingMember } = await supabase
            .from('space_members')
            .select('id')
            .eq('space_id', space.id)
            .eq('user_id', targetUser.id)
            .single();

        if (existingMember) {
            return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
        }

        // 5. Create Notification
        const { error: notifError } = await supabase
            .from('notifications')
            .insert({
                user_id: targetUser.id,
                type: 'space_invite',
                title: `Invite to join ${space.name}`,
                message: `${session.user.email} invited you to join the space "${space.name}".`,
                data: {
                    space_id: space.id,
                    space_slug: slug,
                    space_name: space.name,
                    inviter_id: session.user.id
                }
            });

        if (notifError) {
            throw notifError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
