import 'server-only';
import { google } from 'googleapis';
import { getValidAccessToken } from './gmail-tokens';

// Gmail API type definitions - flexible to match Google's schema
interface GmailHeader {
  name?: string | null;
  value?: string | null;
}

interface GmailMessagePart {
  mimeType?: string | null;
  body?: {
    data?: string | null;
    size?: number | null;
  };
  parts?: GmailMessagePart[];
  headers?: GmailHeader[];
}

interface GmailPayload {
  headers?: GmailHeader[];
  body?: {
    data?: string | null;
    size?: number | null;
  };
  mimeType?: string | null;
  parts?: GmailMessagePart[];
}

/**
 * Create authenticated Gmail client for a user
 */
export async function getGmailClient(userId: string) {
  const accessToken = await getValidAccessToken(userId);

  if (!accessToken) {
    throw new Error('No valid Gmail access token available');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * List recent messages
 */
export async function listMessages(
  userId: string,
  maxResults: number = 20,
  query?: string
) {
  const gmail = await getGmailClient(userId);

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: query,
    labelIds: ['INBOX'],
  });

  return response.data.messages || [];
}

/**
 * Get full message details
 */
export async function getMessage(userId: string, messageId: string) {
  const gmail = await getGmailClient(userId);

  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  return response.data;
}

/**
 * Get unread message count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const gmail = await getGmailClient(userId);

  const response = await gmail.users.messages.list({
    userId: 'me',
    labelIds: ['INBOX', 'UNREAD'],
    maxResults: 1,
  });

  return response.data.resultSizeEstimate || 0;
}

/**
 * Mark message as read
 */
export async function markAsRead(userId: string, messageId: string) {
  const gmail = await getGmailClient(userId);

  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      removeLabelIds: ['UNREAD'],
    },
  });
}

/**
 * Toggle star status
 */
export async function toggleStar(userId: string, messageId: string, isStarred: boolean) {
  const gmail = await getGmailClient(userId);

  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      addLabelIds: isStarred ? ['STARRED'] : [],
      removeLabelIds: isStarred ? [] : ['STARRED'],
    },
  });
}

/**
 * Search messages by query
 */
export async function searchMessages(
  userId: string,
  query: string,
  maxResults: number = 20
) {
  return listMessages(userId, maxResults, query);
}

/**
 * Parse email headers
 */
export function parseHeaders(headers: Array<{ name?: string | null; value?: string | null }>): {
  from: string;
  to: string;
  subject: string;
  date: string;
} {
  const getHeader = (name: string) => {
    const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  };

  return {
    from: getHeader('From'),
    to: getHeader('To'),
    subject: getHeader('Subject'),
    date: getHeader('Date'),
  };
}

/**
 * Extract email body (both text and HTML)
 */
export function extractBody(payload: GmailPayload): { text: string; html: string } {
  let text = '';
  let html = '';

  // Direct body data
  if (payload.body?.data) {
    const content = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    if (payload.mimeType?.toLowerCase().includes('text/html')) {
      html = content;
    } else {
      text = content;
    }
    return { text, html };
  }

  // Multipart message
  if (payload.parts) {
    const extractFromParts = (parts: GmailMessagePart[], depth: number = 0): void => {
      for (const part of parts) {
        const mimeType = part.mimeType?.toLowerCase() || '';
        console.log(`[Gmail] Part depth=${depth} mime=${mimeType} hasBody=${!!part.body?.data} hasParts=${!!part.parts}`);

        // Handle nested parts recursively
        if (part.parts && part.parts.length > 0) {
          extractFromParts(part.parts, depth + 1);
          continue;
        }

        if (part.body?.data) {
          const content = Buffer.from(part.body.data, 'base64').toString('utf-8');

          if (mimeType.includes('text/plain') && !text) {
            console.log(`[Gmail] Found TEXT body (${content.length} chars)`);
            text = content;
          } else if (mimeType.includes('text/html') && !html) {
            console.log(`[Gmail] Found HTML body (${content.length} chars)`);
            html = content;
          }
        }
      }
    };

    extractFromParts(payload.parts);
  }

  return { text, html };
}
