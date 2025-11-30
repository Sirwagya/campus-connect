"use server";

import { createClient } from "@/lib/supabase/server";

export interface DashboardData {
    featuredEvents: any[];
    announcements: any[];
    trendingFeed: any[];
    userRole: string | null;
}

export async function getDashboardData(): Promise<DashboardData> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            featuredEvents: [],
            announcements: [],
            trendingFeed: [],
            userRole: null,
        };
    }

    // Parallel Fetching
    const [eventsRes, announcementsRes, trendingRes, userRoleRes] =
        await Promise.all([
            // 1. Featured Events (Approved, Upcoming, Limit 3)
            supabase
                .from("events")
                .select(
                    "id, title, description, start_ts, location, image_path, participants_count"
                )
                .eq("approved", true)
                .gt("start_ts", new Date().toISOString())
                .order("start_ts", { ascending: true })
                .limit(3),

            // 2. Announcements (Admin Posts, Limit 3)
            supabase
                .from("posts")
                .select(
                    `
          id, 
          content, 
          created_at, 
          user:users!inner(full_name, role)
        `
                )
                .eq("user.role", "admin") // Filter by joined user role
                .order("created_at", { ascending: false })
                .limit(3),

            // 3. Trending Feed (Top Engagement, Limit 2)
            // Note: Sorting by computed column (likes + comments) isn't directly supported in simple PostgREST.
            // We'll sort by likes for now as a proxy, or fetch a bit more and sort in JS.
            // Let's fetch top 10 by likes and sort in JS for better accuracy if needed.
            supabase
                .from("posts")
                .select(
                    `
          id, 
          content, 
          created_at, 
          likes_count, 
          comments_count, 
          user:users(full_name, email)
        `
                )
                .order("likes_count", { ascending: false })
                .limit(2),

            // 4. User Role
            supabase.from("users").select("role").eq("id", user.id).single(),
        ]);

    // Process Trending (Sort by likes + comments)
    let trendingFeed = trendingRes.data || [];
    trendingFeed = trendingFeed
        .sort(
            (a, b) =>
                b.likes_count + b.comments_count - (a.likes_count + a.comments_count)
        )
        .slice(0, 2);

    return {
        featuredEvents: eventsRes.data || [],
        announcements: announcementsRes.data || [],
        trendingFeed: trendingFeed,
        userRole: userRoleRes.data?.role || "student",
    };
}
