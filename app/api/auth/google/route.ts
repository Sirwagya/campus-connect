import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const cookieStore = await cookies();

    // Create a response that we'll modify with cookies
    let response = NextResponse.redirect(new URL("/login", request.url));

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${requestUrl.origin}/api/auth/callback`,
            queryParams: {
                access_type: "offline",
                prompt: "consent",
            },
        },
    });

    if (error) {
        console.error("OAuth error:", error);
        return NextResponse.redirect(
            new URL("/login?error=oauth_error", request.url)
        );
    }

    if (data.url) {
        return NextResponse.redirect(data.url);
    }

    return NextResponse.redirect(new URL("/login", request.url));
}
