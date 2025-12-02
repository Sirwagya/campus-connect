
import { NextRequest, NextResponse } from "next/server";
import { fetchGitHubStats } from "@/lib/profile/integrations/github";
import { generateGitHubHeatmapSvg } from "@/lib/profile/integrations/github-svg";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");

    if (!username) {
        return new NextResponse("Username is required", { status: 400 });
    }

    try {
        const stats = await fetchGitHubStats(username);

        if (!stats) {
            // Return an empty/error SVG if fetch fails
            return new NextResponse(generateGitHubHeatmapSvg({
                username,
                avatar_url: "",
                public_repos: 0,
                followers: 0,
                contributions: 0,
                bio: "",
                location: ""
            }), {
                headers: { "Content-Type": "image/svg+xml" }
            });
        }

        const svg = generateGitHubHeatmapSvg(stats);

        return new NextResponse(svg, {
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
        });
    } catch (error) {
        console.error("Error generating GitHub graph:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
