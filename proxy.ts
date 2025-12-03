import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/api/auth") && // Allow auth API routes
    !request.nextUrl.pathname.startsWith("/profile") && // Allow public profiles
    !request.nextUrl.pathname.startsWith("/api/profiles") && // Allow public profile APIs
    !request.nextUrl.pathname.startsWith("/_next") &&
    !request.nextUrl.pathname.includes(".") // static files
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Domain validation (if user is logged in)
  if (user) {
    const allowedDomain = process.env.ALLOWED_DOMAIN || "vedamsot.org";
    const email = user.email || "";
    if (!email.endsWith(`@${allowedDomain}`)) {
      // Sign out if invalid domain
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=invalid_domain", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
