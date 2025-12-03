import { createServerSupabase, supabaseAdmin } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabase()

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${error.message}`)
    }

    const { session, user } = data

    // Validate domain
    const email = user.email
    if (!email || !email.endsWith('@vedamsot.org')) {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=Invalid domain. Only @vedamsot.org emails are allowed.`
      )
    }

    // Extract Google OAuth tokens from provider
    const providerToken = session.provider_token
    const providerRefreshToken = session.provider_refresh_token

    if (!providerToken || !providerRefreshToken) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=Failed to obtain Google tokens`
      )
    }

    // Calculate token expiry (Google tokens typically expire in 3600 seconds)
    const expiresIn = 3600 // Default to 1 hour
    const tokenExpiry = Date.now() + expiresIn * 1000 // Unix timestamp in milliseconds

    // Ensure we have email
    const userEmail = user.email;
    if (!userEmail) {
      console.error('No email found for user');
      return NextResponse.redirect(`${requestUrl.origin}/login?error=No email found`);
    }

    // Store tokens in database (upsert to create user if needed)
    // Use supabaseAdmin to bypass RLS policies for insert/update
    // Store tokens in database
    // The user row is created by the trigger on auth.users insert
    // We just need to update the tokens for the Gmail integration
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        google_access_token: providerToken,
        google_refresh_token: providerRefreshToken,
        token_expiry: tokenExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to store tokens:', updateError)
      // Continue anyway - user is authenticated
    }

    // Redirect to alerts page
    return NextResponse.redirect(`${requestUrl.origin}/alerts`)
  }

  // No code present
  return NextResponse.redirect(`${requestUrl.origin}/login?error=No code provided`)
}
