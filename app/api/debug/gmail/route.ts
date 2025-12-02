import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getGmailTokens } from "@/lib/gmail-tokens";
import { listMessages } from "@/lib/gmail";

type GmailDebugResponse = {
  authenticated: boolean;
  user?: {
    id: string;
    email: string | undefined;
  };
  tokens?: {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    expiry: string | null;
    isExpired: boolean | null;
  };
  gmail?: {
    connectivity: string;
    messageCount: number;
  };
  scopes?: {
    expected: string[];
    note: string;
  };
  nextSteps?: string[];
  error?: string;
  stack?: string;
};

export async function GET() {
  try {
    console.log('=== GMAIL DEBUG ===');

    // Get authenticated user
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({
        error: 'Not authenticated',
        authenticated: false,
      });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Get stored tokens
    const tokens = await getGmailTokens(userId);

    // Test Gmail API connectivity
    let gmailConnectivity = 'FAILED';
    let messageCount = 0;

    if (tokens) {
      try {
        const messages = await listMessages(userId, 1);
        messageCount = messages.length;
        gmailConnectivity = 'SUCCESS';
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        gmailConnectivity = `FAILED: ${message}`;
      }
    }

    const response: GmailDebugResponse = {
      authenticated: true,
      user: {
        id: userId,
        email: userEmail,
      },
      tokens: {
        hasAccessToken: !!tokens?.accessToken,
        hasRefreshToken: !!tokens?.refreshToken,
        expiry: tokens?.expiry?.toISOString() || null,
        isExpired: tokens?.expiry ? tokens.expiry < new Date() : null,
      },
      gmail: {
        connectivity: gmailConnectivity,
        messageCount,
      },
      scopes: {
        expected: [
          'email',
          'profile',
          'openid',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.modify',
        ],
        note: 'Check if these were granted during OAuth consent',
      },
      nextSteps: tokens
        ? ['Tokens present', 'Try calling /api/alerts/sync']
        : ['No tokens found', 'Re-login to get tokens'],
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    const response: GmailDebugResponse = {
      authenticated: false,
      error: message,
      stack,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
