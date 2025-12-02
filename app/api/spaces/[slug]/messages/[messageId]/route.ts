import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; messageId: string }> }
) {
    try {
        const { messageId } = await params;
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { content } = await request.json();

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Verify ownership - only author can edit their own message
        const { data: message } = await supabase
            .from('space_messages')
            .select('author_id')
            .eq('id', messageId)
            .single();

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        if (message.author_id !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update message
        const { data: updatedMessage, error } = await supabase
            .from('space_messages')
            .update({
                content: content.trim(),
                is_edited: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', messageId)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(updatedMessage);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; messageId: string }> }
) {
    try {
        const { slug, messageId } = await params;
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the message with space info
        const { data: message } = await supabase
            .from('space_messages')
            .select('author_id, space_id')
            .eq('id', messageId)
            .single();

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Check if user is the author
        const isAuthor = message.author_id === session.user.id;

        // Check if user is owner or moderator of the space
        const { data: space } = await supabase
            .from('spaces')
            .select('id, owner_id')
            .eq('slug', slug)
            .single();

        if (!space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        const isOwner = space.owner_id === session.user.id;

        // Check membership role
        const { data: membership } = await supabase
            .from('space_members')
            .select('role')
            .eq('space_id', space.id)
            .eq('user_id', session.user.id)
            .single();

        const isModerator = membership?.role === 'moderator' || membership?.role === 'owner';

        // Check for global admin
        const { data: user } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        const isAdmin = user?.is_admin;

        // Allow delete if: author, owner, moderator, or global admin
        if (!isAuthor && !isOwner && !isModerator && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Soft delete
        const { error } = await supabase
            .from('space_messages')
            .update({
                is_deleted: true,
                content: 'This message has been deleted.',
                updated_at: new Date().toISOString()
            })
            .eq('id', messageId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
