import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { fetchGitHubStats } from '@/lib/profile/integrations/github';
import { generateGitHubHeatmapSvg } from '@/lib/profile/integrations/github-svg';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Single Source of Truth: Check social_links in profiles
        // We prioritize this because the Edit Profile form saves directly here.
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('social_links')
            .eq('id', id)
            .single();

        let username: string | null = null;
        const socialLinks = profile?.social_links as { github?: string } | null;

        if (socialLinks?.github) {
            // Extract username from URL
            const url = socialLinks.github;
            // Match patterns: github.com/username, github.com/username/, etc.
            const match = url.match(/github\.com\/([^\/]+)/i);
            if (match) {
                username = match[1];
            } else {
                // Fallback: Check if it's a plain username
                if (/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(url)) {
                    username = url;
                }
            }
        }

        if (!username) {
            return new NextResponse(
                '<svg width="200" height="50" xmlns="http://www.w3.org/2000/svg"><text x="10" y="30" fill="#666" font-family="sans-serif">GitHub not connected</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
            );
        }

        // 2. Fetch Stats
        const stats = await fetchGitHubStats(username);

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

    } catch (error: unknown) {
        console.error('[GitHub Graph API] Error:', error);
        return new NextResponse(
            '<svg width="200" height="50" xmlns="http://www.w3.org/2000/svg"><text x="10" y="30" fill="#666" font-family="sans-serif">Internal Error</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' }, status: 500 }
        );
    }
}
