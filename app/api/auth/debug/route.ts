import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options });
          } catch {
            // Ignore
          }
        },
      },
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // Get all cookies
  const allCookies = request.cookies.getAll();
  const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'));
  
  return NextResponse.json({
    authenticated: !!session,
    user: session?.user?.email || null,
    userId: session?.user?.id || null,
    allCookies: allCookies.map(c => c.name),
    supabaseCookies: supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
    sessionExists: !!session,
  });
}
