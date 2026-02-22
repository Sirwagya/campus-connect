import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// DELETE /api/announcements/[id] - Delete announcement (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (userData?.role !== "admin") {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    try {
        const { error } = await supabase.from("posts").delete().eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete announcement error:", error);
        return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
    }
}

// PUT /api/announcements/[id] - Update announcement (admin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (userData?.role !== "admin") {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { content } = body;

        if (!content?.trim()) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const { data: post, error } = await supabase
            .from("posts")
            .update({ content: content.trim() })
            .eq("id", id)
            .select("id, content, created_at, user_id")
            .single();

        if (error) throw error;

        return NextResponse.json({ data: post });
    } catch (error) {
        console.error("Update announcement error:", error);
        return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
    }
}
