import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase-server";
import { sanitizePostContent } from "@/lib/feed/sanitizer";
import type { FeedComment } from "@/types/feed";
import type { Database } from "@/types/database";

type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
type CommentResponse = {
    comments?: FeedComment[];
    comment?: FeedComment;
    error?: string;
};
type CreateCommentPayload = {
    postId: string;
    content: string;
};

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { searchParams } = new URL(request.url);
        const postId = searchParams.get('postId');

        if (!postId) {
            return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
        }

        const { data: comments, error } = await supabase
            .from("comments")
            .select(
                `*, user:users(id, name, full_name, avatar_url, email)`
            )
            .eq("post_id", postId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error('[Comments Fetch] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json<CommentResponse>({ comments: comments as FeedComment[] });
    } catch (error: unknown) {
        console.error('[Comments Fetch] Unexpected error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await request.json()) as Partial<CreateCommentPayload>;
        const { postId, content } = body;

        if (!postId || !content || !content.trim()) {
            return NextResponse.json({ error: 'Post ID and content required' }, { status: 400 });
        }

        // Sanitize content
        const sanitizedContent = sanitizePostContent(content);

        // Use supabaseAdmin for insert to avoid cache issues
        const { data, error } = await supabaseAdmin
            .from("comments")
            .insert<CommentInsert>({
                post_id: postId,
                user_id: session.user.id,
                content: sanitizedContent,
            })
            .select(
                `*, user:users(id, name, full_name, avatar_url, email)`
            )
            .single<FeedComment>();

        if (error) {
            console.error('[Comment Create] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Increment comment count on post (optional, can be done via trigger, but manual here for now)
        // We'll just let the client update the UI optimistically or refetch.
        // Ideally: await supabaseAdmin.rpc('increment_comments', { row_id: postId });

        return NextResponse.json<CommentResponse>({ comment: data });
    } catch (error: unknown) {
        console.error('[Comment Create] Unexpected error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
