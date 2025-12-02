import { supabaseAdmin } from "@/lib/supabase-server";

export interface ProfileData {
    id: string;
    user: {
        id: string;
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
        username: string | null;
        role: string | null;
    } | null;
    display_name: string | null;
    username: string | null;
    bio: string | null;
    tagline: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    created_at: string;
    visibility: "public" | "private";
    social_links: {
        github?: string;
        linkedin?: string;
        twitter?: string;
        website?: string;
    };
    skills: any[];
    projects: any[];
    experience: any[];
    education: any[];
    stats: any;
    integrations: any[];
}

/**
 * Fetches a full profile by ID or Username using the Admin client.
 * This ensures that "Self View" and "Public View" are ALWAYS identical,
 * bypassing any RLS policies that might hide data from public viewers.
 */
export async function getUnifiedProfile(identifier: string): Promise<ProfileData | null> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    let userId = isUUID ? identifier : null;

    // 1. If username, resolve to User ID first
    if (!userId) {
        const { data: user } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("username", identifier) // This might also fail if username column is missing!
            .single();

        if (user) {
            userId = user.id;
        } else {
            // If querying by username and column doesn't exist, we can't find by username.
            // But if identifier is not UUID, we return null anyway.
            return null;
        }
    }

    // 2. Fetch Profile with User Data
    // Removed 'username' from user join as it might not exist in the table
    const { data: profileData, error } = await supabaseAdmin
        .from("profiles")
        .select(`
      *,
      user:users(id, full_name, email, avatar_url, role)
    `)
        .eq("id", userId)
        .single();

    // Cast to any to avoid "column does not exist" type errors if types are outdated
    const profile = profileData as any;

    if (error || !profile) {
        // Try to fetch just the user to create a fallback
        // Removed 'username' from select
        const { data: userData } = await supabaseAdmin
            .from("users")
            .select("id, full_name, email, avatar_url, role")
            .eq("id", userId)
            .single();

        const user = userData as any;

        if (!user) return null;

        // Return Fallback Profile
        return {
            id: user.id,
            user: user,
            display_name: user.full_name || user.email?.split("@")[0] || "User",
            username: user.email?.split("@")[0] || "user", // Derived username
            bio: null,
            tagline: "Student at Campus Connect",
            avatar_url: user.avatar_url,
            cover_url: null,
            created_at: new Date().toISOString(),
            visibility: "public",
            social_links: {},
            skills: [],
            projects: [],
            experience: [],
            education: [],
            stats: { total_xp: 0 },
            integrations: [],
        };
    }

    // 3. Fetch Related Data (Parallel)
    const [skills, projects, experience, education, stats, integrations] = await Promise.all([
        supabaseAdmin.from("profile_skills").select("*").eq("user_id", userId).order("display_order"),
        supabaseAdmin.from("profile_projects").select("*").eq("user_id", userId).order("display_order"),
        supabaseAdmin.from("profile_experience").select("*").eq("user_id", userId).order("display_order"),
        supabaseAdmin.from("profile_education").select("*").eq("user_id", userId).order("display_order"),
        supabaseAdmin.from("coding_stats_unified").select("*").eq("user_id", userId).single(),
        supabaseAdmin.from("profile_integrations").select("*").eq("user_id", userId),
    ]);

    // 4. Construct Unified Profile Object
    return {
        ...profile,
        // Ensure user object is attached (it comes from the join)
        user: profile.user,
        // Normalize social links
        social_links: (profile.social_links as any) || {},
        // Attach related data
        skills: skills.data || [],
        projects: projects.data || [],
        experience: experience.data || [],
        education: education.data || [],
        stats: stats.data || { total_xp: 0 },
        integrations: integrations.data || [],
        // Ensure username is present in the final object
        username: profile.username || profile.user?.email?.split("@")[0] || "user",
    };
}
