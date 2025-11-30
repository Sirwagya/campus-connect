// lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Admin (service-role) client for server-side tasks (writing tokens to DB).
 * Requires SUPABASE_SERVICE_ROLE_KEY env var.
 */
export const supabaseAdmin = createClient(
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
export async function createServerSupabase(responseForCookies?: {
  // optionally provide an object that has .cookies.set so we can mirror cookies to the outgoing Response
  setCookie?: (name: string, value: string, options?: any) => void;
}) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // read cookie
        get(name: string) {
          try {
            return cookieStore.get(name)?.value;
          } catch {
            return undefined;
          }
        },

        // set cookie: write to cookieStore (server) and mirror to response if provided
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {}
          try {
            if (responseForCookies?.setCookie) {
              responseForCookies.setCookie(name, value, options);
            }
          } catch {}
        },

        // remove cookie => write empty value with same options
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {}
          try {
            if (responseForCookies?.setCookie) {
              responseForCookies.setCookie(name, '', options);
            }
          } catch {}
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
export function createProxySupabase(req: Request) {
  const cookieHeader = req.headers.get('cookie') ?? '';

  return createServerClient(
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
