import 'server-only';
import { supabaseAdmin } from './supabase-server';
import { encrypt } from './encryption';

interface UserInfo {
  email: string;
  name?: string;
  picture?: string;
  id?: string;
}

interface Tokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || 'vedamsot.org';

export function isAllowedDomain(email: string): boolean {
  return email.endsWith(`@${ALLOWED_DOMAIN}`);
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) return null;
  return data;
}

export async function saveUser(userInfo: UserInfo, tokens: Tokens) {
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', userInfo.email)
    .single();

  let userId = existingUser?.id;

  if (!userId) {
    // Create auth user if needed, or just insert into public.users
    // Assuming public.users is the source of truth for this custom flow
    // But ideally we sync with auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userInfo.email,
      email_confirm: true,
      user_metadata: { name: userInfo.name, avatar_url: userInfo.picture }
    });

    if (authUser?.user) {
      userId = authUser.user.id;
    } else if (authError) {
      // Fallback if user exists in auth but not public
      // Note: Supabase doesn't have getUserByEmail, so we query the public.users table
      const { data: existingAuthUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', userInfo.email)
        .limit(1);
      if (existingAuthUsers && existingAuthUsers.length > 0) {
        userId = existingAuthUsers[0].id;
      }
    }
  }

  if (!userId) throw new Error('Failed to resolve User ID');

  await supabaseAdmin.from('users').upsert({
    id: userId,
    email: userInfo.email,
    name: userInfo.name,
    avatar: userInfo.picture,
    google_id: userInfo.id,
    access_token: encrypt(tokens.access_token!),
    refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
    token_expiry: tokens.expiry_date,
    last_sync: new Date().toISOString(),
  }, { onConflict: 'id' });

  return userId;
}
