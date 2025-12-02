import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database";

type CommentInsert = Database["public"]["Tables"]["event_comments"]["Insert"];
type CommentRow = Database["public"]["Tables"]["event_comments"]["Row"];
type CommentWithUser = CommentRow & {
    user: {
        id: string;
        name: string | null;
        avatar_url: string | null;
    };
};

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

        const payload: CommentInsert = {
          event_id: id,
          user_id: user.id,
          body: body.content,
          parent_id: body.parent_id || null,
        };

        const { data: comment, error } = await supabase
            .from("event_comments")
            .insert(payload)
            .select("*, user:users(id, name, avatar_url)")
            .single<CommentWithUser>();

        if (error) throw error;

        return NextResponse.json({ comment });
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

    const { data: comments, error } = await supabase
        .from("event_comments")
        .select("*, user:users(id, name, avatar_url)")
        .eq("event_id", id)
        .order("created_at", { ascending: true })
        .returns<CommentWithUser[]>();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comments });
}
