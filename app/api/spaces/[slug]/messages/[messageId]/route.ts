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

        // Verify ownership
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
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
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

        // Verify ownership or moderator status
        // For MVP, strictly allow only author to delete. 
        // TODO: Add moderator check.
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
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
