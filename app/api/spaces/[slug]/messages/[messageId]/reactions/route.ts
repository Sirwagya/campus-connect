import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(
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

        const { emoji } = await request.json();

        if (!emoji) {
            return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
        }

        // Check if reaction already exists
        const { data: existingReaction } = await supabase
            .from('space_message_reactions')
            .select('id')
            .eq('message_id', messageId)
            .eq('user_id', session.user.id)
            .eq('emoji', emoji)
            .single();

        if (existingReaction) {
            // Remove reaction (Toggle off)
            const { error: deleteError } = await supabase
                .from('space_message_reactions')
                .delete()
                .eq('id', existingReaction.id);

            if (deleteError) {
                return NextResponse.json({ error: deleteError.message }, { status: 500 });
            }

            return NextResponse.json({ action: 'removed' });
        } else {
            // Add reaction (Toggle on)
            const { error: insertError } = await supabase
                .from('space_message_reactions')
                .insert({
                    message_id: messageId,
                    user_id: session.user.id,
                    emoji
                });

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }

            return NextResponse.json({ action: 'added' });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
