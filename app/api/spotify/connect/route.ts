import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/spotify/callback`;

const SCOPES = [
    "user-read-currently-playing",
    "user-read-playback-state",
].join(" ");

/**
 * GET /api/spotify/connect
 * Initiates Spotify OAuth flow
 */
export async function GET(request: NextRequest) {
    try {
        if (!SPOTIFY_CLIENT_ID) {
            return NextResponse.json(
                { error: "Spotify not configured" },
                { status: 500 }
            );
        }

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Generate state for CSRF protection
        const state = Buffer.from(
            JSON.stringify({ userId: user.id, timestamp: Date.now() })
        ).toString("base64");

        const authUrl = new URL("https://accounts.spotify.com/authorize");
        authUrl.searchParams.set("client_id", SPOTIFY_CLIENT_ID);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
        authUrl.searchParams.set("scope", SCOPES);
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("show_dialog", "true");

        return NextResponse.redirect(authUrl.toString());
    } catch (error) {
        console.error("Spotify connect error:", error);
        return NextResponse.json(
            { error: "Failed to initiate Spotify connection" },
            { status: 500 }
        );
    }
}
