import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, supabaseAdmin } from '@/lib/supabase-server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        const viewerId = session?.user?.id;
        const { id: targetUserId } = await params;

        // 1. Fetch Profile (Canonical Source)
        // We use supabaseAdmin to bypass RLS initially, then filter manually based on visibility logic
        // This ensures we can distinguish between "doesn't exist" and "private"
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select(`
        *,
        user:users(full_name, email, avatar_url, role),
        stats:coding_stats_unified(*),
        integrations:profile_integrations(*),
        skills:profile_skills(*),
        projects:profile_projects(*),
        experience:profile_experience(*),
        education:profile_education(*)
      `)
            .eq('id', targetUserId)
            .single();

        // 2. Handle Not Found
        if (profileError || !profile) {
            // Fallback: Check if user exists in public.users even if no profile row
            const { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .select('id, full_name, email, avatar_url') // Removed username to be safe
                .eq('id', targetUserId)
                .single();

            if (userError || !user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            // Return minimal profile for user without full profile setup
            return NextResponse.json({
                profile: {
                    id: user.id,
                    user: user,
                    display_name: user.full_name || user.email?.split('@')[0],
                    username: user.email?.split('@')[0], // Fallback to email prefix
                    avatar_url: user.avatar_url,
                    bio: null,
                    tagline: "Student at Campus Connect",
                    visibility: 'public', // Default to public for basic info
                    is_owner: viewerId === targetUserId,
                    stats: { total_xp: 0, level: 1 },
                    integrations: [],
                    skills: [],
                    projects: [],
                }
            });
        }

        // 3. Visibility Logic
        const isOwner = viewerId === targetUserId;
        const isPublic = profile.visibility === 'public';

        if (!isPublic && !isOwner) {
            // Private Profile: Return limited data
            return NextResponse.json({
                profile: {
                    id: profile.id,
                    user: {
                        full_name: profile.user?.full_name,
                        avatar_url: profile.user?.avatar_url,
                        username: profile.user?.username, // Assuming username is safe
                    },
                    display_name: profile.display_name || profile.user?.full_name,
                    avatar_url: profile.avatar_url || profile.user?.avatar_url,
                    visibility: 'private',
                    is_owner: false,
                    // Don't include bio, skills, integrations, etc.
                }
            });
        }

        // 4. Public or Owner: Return full data
        return NextResponse.json({
            profile: {
                ...profile,
                // Ensure user object is populated if missing from join (though it shouldn't be)
                user: profile.user || {},
                is_owner: isOwner,
                // For owner, we might include sensitive data if any (e.g. email settings)
                // For public, we might sanitize further if needed
            }
        });

    } catch (error: any) {
        console.error('[Profile API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
