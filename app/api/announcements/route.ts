import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-server";

interface Post {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
}

// GET /api/announcements - Fetch announcements (posts by admins)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "5", 10);

        // Fetch admin users first
        const { data: adminUsers } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("role", "admin");

        if (!adminUsers || adminUsers.length === 0) {
            return NextResponse.json({ data: [] });
        }

        const adminIds = adminUsers.map((u) => u.id);

        // Fetch posts from admin users
        const { data: posts, error } = await supabaseAdmin
            .from("posts")
            .select("*")
            .in("user_id", adminIds)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Announcements fetch error:", error);
            return NextResponse.json({ data: [] });
        }

        // Cast to proper type
        const typedPosts = (posts || []) as Post[];

        // Fetch user details for each post
        const userIds = [...new Set(typedPosts.map((p) => p.user_id))];
        const { data: users } = await supabaseAdmin
            .from("users")
            .select("id, full_name, avatar_url")
            .in("id", userIds);

        const userMap = new Map(users?.map((u) => [u.id, u]) || []);

        const announcements = typedPosts.map((post) => ({
            id: post.id,
            content: post.content,
            created_at: post.created_at,
            user: userMap.get(post.user_id) || null,
        }));

        return NextResponse.json({ data: announcements });
    } catch (error) {
        console.error("Announcements API error:", error);
        return NextResponse.json({ data: [] });
    }
}

// POST /api/announcements - Create announcement (admin only)
export async function POST(request: NextRequest) {
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

        // Create the announcement as a post
        const { data: post, error } = await supabase
            .from("posts")
            .insert({
                user_id: user.id,
                content: content.trim(),
            })
            .select("*")
            .single();

        if (error) throw error;

        // Get user details
        const { data: postUser } = await supabaseAdmin
            .from("users")
            .select("id, full_name, avatar_url")
            .eq("id", user.id)
            .single();

        return NextResponse.json({
            data: {
                ...(post as Post),
                user: postUser,
            },
        });
    } catch (error) {
        console.error("Create announcement error:", error);
        return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
    }
}
