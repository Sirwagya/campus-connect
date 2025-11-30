import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const supabase = await createServerSupabase();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const before = searchParams.get('before'); // Timestamp for pagination

        // Get Space ID first (could be optimized with a join, but this is safer for RLS)
        const { data: space } = await supabase
            .from('spaces')
            .select('id')
            .eq('slug', slug)
            .single();

        if (!space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        let query = supabase
            .from('space_messages')
            .select(`
        *,
        author:users!author_id(id, name, full_name, avatar_url),
        reactions:space_message_reactions(emoji, user_id)
      `)
            .eq('space_id', space.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (before) {
            query = query.lt('created_at', before);
        }

        const { data: messages, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ messages: messages.reverse() }); // Return in chronological order
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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

        const body = await request.json();
        const { content, replyTo } = body;

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Get Space ID
        const { data: space } = await supabase
            .from('spaces')
            .select('id')
            .eq('slug', slug)
            .single();

        if (!space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        // Verify membership (RLS handles this, but explicit check is good for UX feedback)
        // Actually, let's rely on RLS "Members can post messages" policy.

        const { data: message, error } = await supabase
            .from('space_messages')
            .insert({
                space_id: space.id,
                author_id: session.user.id,
                content: content.trim(),
                reply_to: replyTo || null
            })
            .select(`
        *,
        author:users!author_id(id, name, full_name, avatar_url)
      `)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
