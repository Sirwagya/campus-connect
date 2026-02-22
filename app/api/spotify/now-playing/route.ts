import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

interface SpotifyTokenData {
    refresh_token: string;
    access_token: string;
    expires_at: number;
}

interface SpotifyNowPlayingResponse {
    is_playing: boolean;
    item?: {
        name: string;
        artists: Array<{ name: string }>;
        album: {
            name: string;
            images: Array<{ url: string }>;
        };
        duration_ms: number;
    };
    progress_ms?: number;
    device?: {
        name: string;
        type: string;
    };
}

/**
 * Refreshes Spotify access token using refresh token
 */
async function refreshAccessToken(
    refreshToken: string
): Promise<{ access_token: string; expires_in: number } | null> {
    try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(
                    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
                ).toString("base64")}`,
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
        });

        if (!response.ok) {
            console.error("Token refresh failed:", await response.text());
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Token refresh error:", error);
        return null;
    }
}

/**
 * GET /api/spotify/now-playing?userId=xyz
 * Returns the currently playing track for a user
 */
export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "userId required" },
                { status: 400 }
            );
        }

        // Get user's Spotify integration data
        // Note: Using 'as any' because external_data column may not be in generated types yet
        const { data: integration, error: dbError } = await supabaseAdmin
            .from("profile_integrations")
            .select("*")
            .eq("user_id", userId)
            .eq("platform", "spotify")
            .single();

        const integrationData = integration as any;

        if (dbError || !integrationData || !integrationData.verified) {
            return NextResponse.json(
                { is_playing: false, not_connected: true },
                { status: 200 }
            );
        }

        const tokenData = (integrationData.external_data || integrationData.platform_data) as SpotifyTokenData;

        if (!tokenData?.refresh_token) {
            return NextResponse.json(
                { is_playing: false, not_connected: true },
                { status: 200 }
            );
        }

        // Check if token is expired and refresh if needed
        let accessToken = tokenData.access_token;
        if (!tokenData.expires_at || Date.now() >= tokenData.expires_at - 60000) {
            const refreshed = await refreshAccessToken(tokenData.refresh_token);
            if (!refreshed) {
                return NextResponse.json(
                    { is_playing: false, token_error: true },
                    { status: 200 }
                );
            }

            accessToken = refreshed.access_token;

            // Update stored tokens - using platform_data as fallback for external_data
            await supabaseAdmin
                .from("profile_integrations")
                .update({
                    platform_data: {
                        ...tokenData,
                        access_token: refreshed.access_token,
                        expires_at: Date.now() + refreshed.expires_in * 1000,
                    },
                } as any)
                .eq("user_id", userId)
                .eq("platform", "spotify");
        }

        // Fetch currently playing from Spotify
        const spotifyResponse = await fetch(
            "https://api.spotify.com/v1/me/player/currently-playing",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        // 204 = No content (nothing playing)
        if (spotifyResponse.status === 204) {
            return NextResponse.json({ is_playing: false }, { status: 200 });
        }

        if (!spotifyResponse.ok) {
            console.error("Spotify API error:", spotifyResponse.status);
            return NextResponse.json({ is_playing: false }, { status: 200 });
        }

        const spotifyData: SpotifyNowPlayingResponse = await spotifyResponse.json();

        if (!spotifyData.item) {
            return NextResponse.json({ is_playing: false }, { status: 200 });
        }

        // Format response
        return NextResponse.json({
            is_playing: spotifyData.is_playing,
            name: spotifyData.item.name,
            artists: spotifyData.item.artists.map((a) => a.name),
            album: spotifyData.item.album.name,
            album_art:
                spotifyData.item.album.images[0]?.url ||
                spotifyData.item.album.images[1]?.url ||
                "",
            duration_ms: spotifyData.item.duration_ms,
            progress_ms: spotifyData.progress_ms || 0,
            device: spotifyData.device
                ? {
                    name: spotifyData.device.name,
                    type: spotifyData.device.type.toLowerCase(),
                }
                : undefined,
        });
    } catch (error) {
        console.error("Now playing error:", error);
        return NextResponse.json({ is_playing: false }, { status: 200 });
    }
}
