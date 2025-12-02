import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import type { Database } from '@/types/database';

type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

type InvitePayload = {
    email?: string;
    userId?: string;
};

const buildErrorResponse = (error: unknown, status = 500) => {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status });
};

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

        const { email, userId } = (await request.json()) as InvitePayload;

        if (!email && !userId) {
            return NextResponse.json({ error: 'Email or userId is required' }, { status: 400 });
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

        // 3. Find User by userId, email, or name
        let targetUser: { id: string; name: string | null } | null = null;

        // If userId is provided, use it directly
        if (userId) {
            const { data } = await supabase
                .from('users')
                .select('id, name')
                .eq('id', userId)
                .single();
            targetUser = data;
        } else if (email) {
            // Try to find by email in public.users first
            const { data: userByEmail } = await supabase
                .from('users')
                .select('id, name')
                .eq('email', email)
                .single();
            targetUser = userByEmail;

            if (!targetUser) {
                // Fallback: Try to find by username (name)
                const { data: userByName } = await supabase
                    .from('users')
                    .select('id, name')
                    .eq('name', email)
                    .single();
                targetUser = userByName;
            }
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
            } satisfies NotificationInsert);

        if (notifError) {
            throw notifError;
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return buildErrorResponse(error);
    }
}
