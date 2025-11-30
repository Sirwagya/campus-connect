import 'server-only';
import { supabaseAdmin } from './supabase-server';

interface GmailTokens {
  accessToken: string;
  refreshToken: string | null;
  expiry: Date | null;
}

/**
 * Get stored Gmail tokens for a user
 */
export async function getGmailTokens(userId: string): Promise<GmailTokens | null> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('google_access_token, google_refresh_token, token_expiry')
    .eq('id', userId)
    .single();

  if (error || !user || !user.google_access_token) {
    console.error('[Gmail Tokens] No tokens found for user:', userId);
    return null;
  }

  return {
    accessToken: user.google_access_token,
    refreshToken: user.google_refresh_token,
    expiry: (() => {
      if (!user.token_expiry) return null;
      // Handle legacy ISO strings
      if (typeof user.token_expiry === 'string' && user.token_expiry.includes('T')) {
        return new Date(user.token_expiry);
      }
      // Handle timestamps (number or string of digits)
      return new Date(Number(user.token_expiry));
    })(),
  };
}

/**
 * Refresh Google access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Token Refresh] Failed:', error);
      return null;
    }

    const data = await response.json();
    console.log('[Token Refresh] ✅ New access token obtained');
    return data.access_token;
  } catch (error) {
    console.error('[Token Refresh] Error:', error);
    return null;
  }
}

/**
 * Save Gmail tokens to database
 */
export async function saveGmailTokens(
  userId: string,
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  const tokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour

  const updates: any = {
    google_access_token: accessToken,
    token_expiry: tokenExpiry.getTime(), // Store as timestamp (bigint)
    updated_at: new Date().toISOString(),
  };

  if (refreshToken) {
    updates.google_refresh_token = refreshToken;
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('[Save Tokens] Error:', error);
    throw error;
  }

  console.log('[Save Tokens] ✅ Tokens updated for user:', userId);
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const tokens = await getGmailTokens(userId);

  if (!tokens) {
    console.error('[Valid Token] No tokens found');
    return null;
  }

  // Check if token is expired (or will expire in 5 minutes)
  const expiryBuffer = new Date(Date.now() + 5 * 60 * 1000);
  const isExpired = tokens.expiry && tokens.expiry < expiryBuffer;

  if (isExpired && tokens.refreshToken) {
    console.log('[Valid Token] Token expired, refreshing...');
    const newAccessToken = await refreshAccessToken(tokens.refreshToken);

    if (newAccessToken) {
      await saveGmailTokens(userId, newAccessToken);
      return newAccessToken;
    } else {
      console.error('[Valid Token] Refresh failed');
      return null;
    }
  }

  return tokens.accessToken;
}
