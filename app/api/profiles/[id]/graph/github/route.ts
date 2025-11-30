import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, supabaseAdmin } from '@/lib/supabase-server';
import { fetchGitHubStats } from '@/lib/profile/integrations/github';
import { generateGitHubHeatmapSvg } from '@/lib/profile/integrations/github-svg';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Get GitHub username from profile_integrations
        // Use admin client to allow public viewing of graphs
        const { data: integration, error } = await supabaseAdmin
            .from('profile_integrations')
            .select('username, platform_data')
            .eq('user_id', id)
            .eq('platform', 'github')
            .single();

        if (error || !integration) {
            // Fallback: Check if social_links in profiles has github
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('social_links')
                .eq('id', id)
                .single();

            if (profile?.social_links?.github) {
                // Extract username from URL
                const url = profile.social_links.github;
                const match = url.match(/github\.com\/([^\/]+)/);
                if (match) {
                    const username = match[1];
                    const stats = await fetchGitHubStats(username);
                    if (stats) {
                        const svg = generateGitHubHeatmapSvg(stats);
                        return new NextResponse(svg, {
                            headers: {
                                'Content-Type': 'image/svg+xml',
                                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                            },
                        });
                    }
                }
            }

            return new NextResponse(
                '<svg width="200" height="50" xmlns="http://www.w3.org/2000/svg"><text x="10" y="30" fill="#666" font-family="sans-serif">GitHub not connected</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
            );
        }

        // 2. Fetch Stats
        const stats = await fetchGitHubStats(integration.username);

        if (!stats) {
            return new NextResponse(
                '<svg width="200" height="50" xmlns="http://www.w3.org/2000/svg"><text x="10" y="30" fill="#666" font-family="sans-serif">Failed to load GitHub data</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
            );
        }

        // 3. Generate SVG
        const svg = generateGitHubHeatmapSvg(stats);

        // 4. Return SVG with caching
        return new NextResponse(svg, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
            },
        });

    } catch (error: any) {
        console.error('[GitHub Graph API] Error:', error);
        return new NextResponse(
            '<svg width="200" height="50" xmlns="http://www.w3.org/2000/svg"><text x="10" y="30" fill="#666" font-family="sans-serif">Internal Error</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' }, status: 500 }
        );
    }
}
