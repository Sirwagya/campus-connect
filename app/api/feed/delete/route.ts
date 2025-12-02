import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase-server";
import type { Database } from "@/types/database";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

type DeletePostResponse =
    | { success: true }
    | { error: string; status?: number };

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const postId = searchParams.get("postId");

        if (!postId) {
            return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
        }

        // Verify ownership
        // We can do this by adding a filter to the delete query, 
        // but using supabaseAdmin ensures we bypass any RLS weirdness if it exists,
        // so we should verify ownership manually first if using admin, OR just use the user client.
        // Given the previous RLS/Cache issues, let's verify ownership manually then use Admin to delete.

        const { data: post } = await supabaseAdmin
            .from("posts")
            .select("user_id")
            .eq("id", postId)
            .single<PostRow>();

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (post.user_id !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete post using Admin to ensure it works
        const { error } = await supabaseAdmin
            .from("posts")
            .delete()
            .eq("id", postId);

        if (error) {
            console.error('[Delete Post] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json<DeletePostResponse>({ success: true });
    } catch (error: unknown) {
        console.error('[Delete Post] Unexpected error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json<DeletePostResponse>({ error: message }, { status: 500 });
    }
}
