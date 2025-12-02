import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';

// SECURITY: Require SESSION_SECRET in production
const SECRET_KEY = process.env.SESSION_SECRET;
if (!SECRET_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET environment variable is required in production');
}

const key = new TextEncoder().encode(SECRET_KEY || 'dev-secret-key-not-for-production');

export async function encryptSession(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decryptSession(input: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  try {
    return await decryptSession(session);
  } catch (error) {
    return null;
  }
}

export async function setSession(payload: JWTPayload) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const session = await encryptSession(payload);
  const cookieStore = await cookies();

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
