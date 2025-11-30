import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, supabaseAdmin } from '@/lib/supabase-server';
import { sanitizePostContent } from '@/lib/feed/sanitizer';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { searchParams } = new URL(request.url);
        const postId = searchParams.get('postId');

        if (!postId) {
            return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
        }

        const { data: comments, error } = await supabase
            .from('comments')
            .select(`
        *,
        user:users(id, name, full_name, avatar_url, email)
      `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[Comments Fetch] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ comments });
    } catch (error: any) {
        console.error('[Comments Fetch] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { postId, content } = body;

        if (!postId || !content || !content.trim()) {
            return NextResponse.json({ error: 'Post ID and content required' }, { status: 400 });
        }

        // Sanitize content
        const sanitizedContent = sanitizePostContent(content);

        // Use supabaseAdmin for insert to avoid cache issues
        const { data, error } = await supabaseAdmin
            .from('comments')
            .insert({
                post_id: postId,
                user_id: session.user.id,
                content: sanitizedContent,
            })
            .select(`
        *,
        user:users(id, name, full_name, avatar_url, email)
      `)
            .single();

        if (error) {
            console.error('[Comment Create] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Increment comment count on post (optional, can be done via trigger, but manual here for now)
        // We'll just let the client update the UI optimistically or refetch.
        // Ideally: await supabaseAdmin.rpc('increment_comments', { row_id: postId });

        return NextResponse.json({ comment: data });
    } catch (error: any) {
        console.error('[Comment Create] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
