import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeFeedPost } from "@/lib/feed/normalize";
import type { FeedResponse, PostWithRelations } from "@/types/feed";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        const userId = session?.user?.id;

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
        const cursor = searchParams.get("cursor");

        let query = supabase
            .from("posts")
            .select(`
                *,
                user:users!posts_user_id_fkey(id, name, full_name, avatar_url, email),
                likes:post_likes(user_id), 
                comments:comments(count)
            `)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (cursor) {
            query = query.lt("created_at", cursor);
        }

        const { data: posts, error } = await query;

        if (error && (error.message || error.code)) {
            console.error("[Feed Fetch] Error:", error.message, error.code, error.details);
            return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
        }

        const rawPosts = (posts || []) as PostWithRelations[];
        const enrichedPosts = rawPosts.map((post) => normalizeFeedPost(post, userId));

        const nextCursor = rawPosts.length === limit ? rawPosts[rawPosts.length - 1].created_at : null;

        return NextResponse.json<FeedResponse>({
            posts: enrichedPosts,
            nextCursor
        });

    } catch (error) {
        console.error("[Feed Fetch] Unexpected error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
