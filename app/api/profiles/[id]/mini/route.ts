import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * GET /api/profiles/[id]/mini
 * Returns profile data for the mini profile popup using admin client
 * for consistent data access (bypasses RLS)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Fetch user data for fallbacks
        const { data: user } = await supabaseAdmin
            .from("users")
            .select("id, full_name, email, avatar_url")
            .eq("id", id)
            .single();

        // 2. Fetch profile data with social links
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select(`
        id,
        display_name,
        username,
        tagline,
        bio,
        avatar_url,
        cover_url,
        created_at,
        visibility,
        social_links
      `)
            .eq("id", id)
            .single();

        // Generate fallback values from user data
        const emailUsername = user?.email?.split("@")[0] || "user";
        const displayName = profile?.display_name || user?.full_name || emailUsername;
        const username = profile?.username || emailUsername;
        const avatarUrl = profile?.avatar_url || user?.avatar_url;

        if (!profile && !user) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        // 3. Fetch integrations (for GitHub URL)
        const { data: integrations } = await supabaseAdmin
            .from("profile_integrations")
            .select("platform, username, verified")
            .eq("user_id", id);

        // Build social links - combine from profile.social_links and integrations
        const socialLinksFromProfile = (profile?.social_links as any) || {};
        const githubIntegration = integrations?.find(i => i.platform === "github");
        const spotifyIntegration = integrations?.find(i => i.platform === "spotify" && i.verified);

        const socialLinks = {
            github: socialLinksFromProfile.github || (githubIntegration?.username ? `https://github.com/${githubIntegration.username}` : null),
            linkedin: socialLinksFromProfile.linkedin || null,
            twitter: socialLinksFromProfile.twitter || null,
            website: socialLinksFromProfile.website || null,
        };

        // 4. Fetch user stats (XP, streak)
        const { data: stats } = await supabaseAdmin
            .from("coding_stats_unified")
            .select("total_xp, current_streak")
            .eq("user_id", id)
            .single();

        // 5. Check online status from presence table
        const { data: presence } = await supabaseAdmin
            .from("presence")
            .select("status, last_seen")
            .eq("user_id", id)
            .single();

        const isOnline =
            presence?.status === "online" ||
            (presence?.last_seen &&
                new Date(presence.last_seen) > new Date(Date.now() - 5 * 60 * 1000));

        // Calculate level from XP
        const totalXp = stats?.total_xp || 0;
        const level = Math.floor(totalXp / 1000) + 1;

        return NextResponse.json({
            id,
            display_name: displayName,
            username: username,
            tagline: profile?.tagline || null,
            bio: profile?.bio || null,
            avatar_url: avatarUrl,
            banner_url: profile?.cover_url || null, // Map cover_url to banner_url for the card
            created_at: profile?.created_at || new Date().toISOString(),
            social_links: socialLinks,
            is_online: isOnline,
            spotify_connected: !!spotifyIntegration,
            stats: {
                total_xp: totalXp,
                level,
                current_streak: stats?.current_streak || 0,
            },
        });
    } catch (error) {
        console.error("Mini profile fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}
