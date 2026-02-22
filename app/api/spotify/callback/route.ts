import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/spotify/callback`;

/**
 * GET /api/spotify/callback
 * Handles Spotify OAuth callback, stores refresh token
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        if (error) {
            return NextResponse.redirect(
                new URL(`/profile/settings?spotify_error=${error}`, request.url)
            );
        }

        if (!code || !state) {
            return NextResponse.redirect(
                new URL("/profile/settings?spotify_error=missing_params", request.url)
            );
        }

        // Decode state to get userId
        let userId: string;
        try {
            const decoded = JSON.parse(Buffer.from(state, "base64").toString());
            userId = decoded.userId;

            // Validate timestamp (15 min expiry)
            if (Date.now() - decoded.timestamp > 15 * 60 * 1000) {
                return NextResponse.redirect(
                    new URL("/profile/settings?spotify_error=expired", request.url)
                );
            }
        } catch {
            return NextResponse.redirect(
                new URL("/profile/settings?spotify_error=invalid_state", request.url)
            );
        }

        // Exchange code for tokens
        const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(
                    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
                ).toString("base64")}`,
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: REDIRECT_URI,
            }),
        });

        if (!tokenResponse.ok) {
            console.error("Spotify token error:", await tokenResponse.text());
            return NextResponse.redirect(
                new URL("/profile/settings?spotify_error=token_error", request.url)
            );
        }

        const tokens = await tokenResponse.json();

        // Store refresh token in database
        const supabase = await createClient();

        // Upsert into profile_integrations
        const { error: dbError } = await supabase.from("profile_integrations").upsert(
            {
                user_id: userId,
                platform: "spotify",
                verified: true,
                is_public: true,
                external_data: {
                    refresh_token: tokens.refresh_token,
                    access_token: tokens.access_token,
                    expires_at: Date.now() + tokens.expires_in * 1000,
                },
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,platform" }
        );

        if (dbError) {
            console.error("Database error:", dbError);
            return NextResponse.redirect(
                new URL("/profile/settings?spotify_error=db_error", request.url)
            );
        }

        // Success - redirect back to settings
        return NextResponse.redirect(
            new URL("/profile/settings?spotify_connected=true", request.url)
        );
    } catch (error) {
        console.error("Spotify callback error:", error);
        return NextResponse.redirect(
            new URL("/profile/settings?spotify_error=unknown", request.url)
        );
    }
}
