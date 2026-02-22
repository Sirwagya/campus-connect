import { createServerSupabase, supabaseAdmin } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface CommentWithUser {
    id: string;
    event_id: string;
    user_id: string;
    body: string;
    parent_id: string | null;
    created_at: string;
    user: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createServerSupabase();
    const { id } = await params;
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await request.json()) as {
            content?: string;
            parent_id?: string | null;
        };

        if (!body.content?.trim()) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        // Insert comment
        const { data: comment, error } = await supabase
            .from("event_comments")
            .insert({
                event_id: id,
                user_id: user.id,
                body: body.content,
                parent_id: body.parent_id || null,
            })
            .select("*")
            .single();

        if (error) throw error;

        // Fetch user data separately
        const { data: userData } = await supabaseAdmin
            .from("users")
            .select("id, full_name, avatar_url")
            .eq("id", user.id)
            .single();

        return NextResponse.json({
            comment: {
                ...comment,
                user: userData,
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createServerSupabase();
    const { id } = await params;

    try {
        // Fetch comments without join
        const { data: comments, error } = await supabase
            .from("event_comments")
            .select("*")
            .eq("event_id", id)
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!comments || comments.length === 0) {
            return NextResponse.json({ comments: [] });
        }

        // Get unique user IDs
        const userIds = [...new Set(comments.map((c) => c.user_id))];

        // Fetch users separately using admin client
        const { data: users } = await supabaseAdmin
            .from("users")
            .select("id, full_name, avatar_url")
            .in("id", userIds);

        // Create user lookup map
        const userMap = new Map(users?.map((u) => [u.id, u]) || []);

        // Combine comments with user data
        const commentsWithUsers: CommentWithUser[] = comments.map((comment) => ({
            ...comment,
            user: userMap.get(comment.user_id) || null,
        }));

        return NextResponse.json({ comments: commentsWithUsers });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Event comments error:", message);
        return NextResponse.json({ comments: [] });
    }
}
