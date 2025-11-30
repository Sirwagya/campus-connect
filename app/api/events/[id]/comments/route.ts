import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

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
        const body = await request.json();
        const { content, parent_id } = body;

        const { data: comment, error } = await supabase
            .from("event_comments")
            .insert({
                event_id: id,
                user_id: user.id,
                body: content,
                parent_id: parent_id || null,
            })
            .select("*, user:users(id, name, avatar_url)")
            .single();

        if (error) throw error;

        return NextResponse.json({ comment });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createServerSupabase();
    const { id } = await params;

    const { data: comments, error } = await supabase
        .from("event_comments")
        .select("*, user:users(id, name, avatar_url)")
        .eq("event_id", id)
        .order("created_at", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comments });
}
