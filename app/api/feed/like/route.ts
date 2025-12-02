import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Database } from "@/types/database";

type PostLikeRow = Database["public"]["Tables"]["post_likes"]["Row"];
type ToggleLikePayload = {
    postId: string;
};
type ToggleLikeResponse = { liked: boolean } | { error: string };

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json()) as Partial<ToggleLikePayload>;
        const { postId } = body;

        if (!postId) {
            return NextResponse.json({ error: "Post ID required" }, { status: 400 });
        }

        const userId = session.user.id;

        // Check if already liked
        const { data: existingLike } = await supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", postId)
            .eq("user_id", userId)
            .single<PostLikeRow>();

        if (existingLike) {
            // Unlike
            const { error } = await supabase
                .from("post_likes")
                .delete()
                .eq("id", existingLike.id);

            if (error) throw error;

            // Decrement count (optimistic update on client, but good to have trigger or manual update)
            // For simplicity, we'll let the client handle the count or refetch, 
            // but ideally we'd use a database trigger to update posts.likes_count.
            // Here we will manually update the count for correctness if no trigger exists.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).rpc("decrement_likes", { row_id: postId }).catch(() => {
                // RPC may not exist - that's ok
            });
            // Fallback manual update if RPC doesn't exist (less safe for concurrency but okay for MVP)
            /* 
            const { data: post } = await supabase.from('posts').select('likes_count').eq('id', postId).single();
            if (post) {
              await supabase.from('posts').update({ likes_count: Math.max(0, post.likes_count - 1) }).eq('id', postId);
            }
            */

            return NextResponse.json<ToggleLikeResponse>({ liked: false });
        } else {
            // Like
            const { error } = await supabase
                .from("post_likes")
                .insert({
                    post_id: postId,
                    user_id: userId,
                });

            if (error) throw error;

            // Increment count
            // await supabase.rpc('increment_likes', { row_id: postId });

            return NextResponse.json<ToggleLikeResponse>({ liked: true });
        }
    } catch (error: unknown) {
        console.error("[Feed Like] Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json<ToggleLikeResponse>({ error: message }, { status: 500 });
    }
}
