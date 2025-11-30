import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        // Optional: Require auth to view feed? 
        // The plan says "Public read for feed", so we might allow unauthenticated access.
        // But we need user_id to check "liked_by_me" status.

        const userId = session?.user?.id;

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const cursor = searchParams.get('cursor'); // created_at timestamp

        let query = supabase
            .from('posts')
            .select(`
        *,
        user:users(id, name, full_name, avatar_url, email),
        likes:post_likes(user_id), 
        comments:comments(count)
      `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (cursor) {
            query = query.lt('created_at', cursor);
        }

        const { data: posts, error } = await query;

        if (error) {
            console.error('[Feed Fetch] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Process posts to add 'liked_by_user' flag
        const enrichedPosts = posts.map((post: any) => ({
            ...post,
            liked_by_user: userId ? post.likes.some((like: any) => like.user_id === userId) : false,
            // Remove raw likes array to save bandwidth/privacy
            likes: undefined,
            likes_count: post.likes_count || 0,
            // Use the count from the relation which is accurate
            comments_count: post.comments?.[0]?.count || 0,
            comments: undefined, // Remove the count object to clean up
        }));

        const nextCursor = posts.length === limit ? posts[posts.length - 1].created_at : null;

        return NextResponse.json({
            posts: enrichedPosts,
            nextCursor
        });

    } catch (error: any) {
        console.error('[Feed Fetch] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
