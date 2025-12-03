import 'server-only';

const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || 'vedamsot.org';

export function isAllowedDomain(email: string): boolean {
  return email.endsWith(`@${ALLOWED_DOMAIN}`);
}

