"use server";

import { createClient } from "@/lib/supabase/server";

export interface DashboardData {
    featuredEvents: FeaturedEvent[];
    announcements: Announcement[];
    trendingFeed: TrendingPost[];
    userRole: string | null;
}

interface FeaturedEvent {
    id: string;
    title: string;
    description: string | null;
    start_ts: string;
    location: string | null;
    image_path: string | null;
    participants_count: number;
}

interface Announcement {
    id: string;
    content: string;
    created_at: string;
    user: {
        full_name: string | null;
        role: string | null;
    } | null;
}

interface TrendingPost {
    id: string;
    content: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    user: {
        id: string;
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
    } | null;
}

export async function getDashboardData(): Promise<DashboardData> {
    try {
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

        // Parallel Fetching with timeout protection
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
                    .eq("user.role", "admin")
                    .order("created_at", { ascending: false })
                    .limit(3),

                // 3. Trending Feed (Top Engagement, Limit 5 for sorting)
                supabase
                    .from("posts")
                    .select(
                        `
                        id, 
                        content, 
                        created_at, 
                        likes_count, 
                        comments_count, 
                        user:users(id, full_name, email, avatar_url)
                    `
                    )
                    .order("likes_count", { ascending: false })
                    .limit(5),

                // 4. User Role
                supabase.from("users").select("role").eq("id", user.id).single(),
            ]);

        // Process Trending (Sort by engagement and take top 2)
        const rawTrending = trendingRes.data || [];
        let trendingFeed: TrendingPost[] = rawTrending.map((post) => ({
            ...post,
            user: Array.isArray(post.user) ? post.user[0] || null : post.user,
        })) as TrendingPost[];
        trendingFeed = trendingFeed
            .sort(
                (a, b) =>
                    (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count)
            )
            .slice(0, 2);

        // Process Announcements
        const rawAnnouncements = announcementsRes.data || [];
        const announcements: Announcement[] = rawAnnouncements.map((post) => ({
            ...post,
            user: Array.isArray(post.user) ? post.user[0] || null : post.user,
        })) as Announcement[];

        return {
            featuredEvents: (eventsRes.data || []) as FeaturedEvent[],
            announcements,
            trendingFeed,
            userRole: userRoleRes.data?.role || "student",
        };
    } catch (error) {
        console.error('[Dashboard] Error fetching data:', error);
        return {
            featuredEvents: [],
            announcements: [],
            trendingFeed: [],
            userRole: null,
        };
    }
}
