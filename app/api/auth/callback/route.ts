import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin client for updating user tokens
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    console.error("No code in callback");
    return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Ignore errors from Server Components
          }
        },
      },
    }
  );

  // Exchange code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Session exchange error:", error.message);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  const { session, user } = data;

  if (!session || !user) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=no_session`);
  }

  // Validate domain
  const email = user.email;
  if (!email || !email.endsWith("@vedamsot.org")) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=invalid_domain`
    );
  }

  // Store Google OAuth tokens if available
  const providerToken = session.provider_token;
  const providerRefreshToken = session.provider_refresh_token;

  if (providerToken && providerRefreshToken) {
    const tokenExpiry = Date.now() + 3600 * 1000; // 1 hour

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        google_access_token: providerToken,
        google_refresh_token: providerRefreshToken,
        token_expiry: tokenExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to store tokens:", updateError);
      // Continue anyway - user is authenticated
    }
  }

  console.log("✅ Auth successful for:", email);

  // Redirect to feed
  return NextResponse.redirect(`${requestUrl.origin}/feed`);
}
