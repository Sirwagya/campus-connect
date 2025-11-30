// proxy.ts  (or rename to middleware.ts in project root)
import { NextRequest, NextResponse } from 'next/server';
import { createProxySupabase } from '@/lib/supabase-server';

/**
 * NOTE: If you are using the new "middleware as proxy" or renamed files,
 * ensure Next is loading this file as middleware. The filename expected by Next is `middleware.ts`.
 */

export async function middleware(req: NextRequest) {
  // keep name `middleware` if file is middleware.ts
  return proxy(req);
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  console.log('\n=== PROXY HIT ===', path);

  // Allow static assets
  if (path.startsWith('/_next') || path.includes('.') || path === '/favicon.ico') {
    return NextResponse.next();
  }

  // Allow login and callback routes + auth API routes through
  if (path === '/login' || path.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Use proxy client which ONLY reads cookies from the incoming request header
  const supabase = createProxySupabase(req);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('Session in proxy:', session?.user?.email ?? 'NONE');

  if (!session) {
    console.log('No session — redirecting to /login');
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // domain validation
  const allowed = `@${process.env.ALLOWED_DOMAIN || 'vedamsot.org'}`;
  const email = session.user.email ?? '';

  if (!email.endsWith(allowed)) {
    console.log('Invalid domain — forcing sign out');
    // We cannot signOut here because middleware cannot mutate cookies reliably;
    // instead redirect to login with error so client can handle sign out.
    return NextResponse.redirect(new URL('/login?error=invalid_domain', req.url));
  }

  // allow
  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};
