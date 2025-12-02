import crypto from 'crypto';

// SECURITY: ENCRYPTION_KEY must be exactly 32 bytes for AES-256
// In production, always use a proper 32-byte key from environment
const rawKey = process.env.ENCRYPTION_KEY || '';

// Pad or truncate to exactly 32 bytes
const ENCRYPTION_KEY = rawKey.length >= 32 
  ? rawKey.slice(0, 32) 
  : rawKey.padEnd(32, '0');

// Warn if using default/weak key in development
if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV !== 'production') {
  console.warn('[SECURITY] ENCRYPTION_KEY not set. Using insecure default key.');
}

const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
