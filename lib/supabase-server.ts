// lib/supabase-server.ts
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database>;

type CookieOptions = {
  domain?: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  sameSite?: "lax" | "strict" | "none";
  httpOnly?: boolean;
  secure?: boolean;
};

type CookieMirror = {
  setCookie?: (name: string, value: string, options?: CookieOptions) => void;
};

/**
 * Admin (service-role) client for server-side tasks (writing tokens to DB).
 * Requires SUPABASE_SERVICE_ROLE_KEY env var.
 */
export const supabaseAdmin: TypedClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // MUST be service role key
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Server-side SSR client to be used inside server routes (e.g. callback).
 * It wires up cookie handlers to the Next.js cookie store so exchangeCodeForSession()
 * will write cookies both to cookieStore and the Response object if provided.
 *
 * NOTE: call this inside server route handlers where `cookies()` is available.
 */
export async function createServerSupabase(
  responseForCookies?: CookieMirror
): Promise<TypedClient> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // getAll for reading all cookies
        getAll() {
          return cookieStore.getAll();
        },
        // setAll for setting multiple cookies
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
              if (responseForCookies?.setCookie) {
                responseForCookies.setCookie(name, value, options as CookieOptions);
              }
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

/**
 * Proxy / middleware client:
 * - This is meant for middleware/proxy where we only have raw request
 * - It reads cookies from the incoming request header string.
 * - It DOES NOT attempt to set cookies (middleware cannot reliably set cookies here).
 */
export function createProxySupabase(req: Request): TypedClient {
  const cookieHeader = req.headers.get('cookie') ?? '';

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // simple safe parse for cookie header
          const re = new RegExp('(?:^|; )' + name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '=([^;]+)');
          return cookieHeader.match(re)?.[1];
        },
        set() {
          // noop in middleware
        },
        remove() {
          // noop
        },
      },
    }
  );
}
