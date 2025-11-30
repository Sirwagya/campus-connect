import { supabaseAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getValidAccessToken } from '@/lib/gmail-tokens';

export async function GET() {
    // Use admin client to bypass RLS for debugging
    const supabase = supabaseAdmin;

    // 1. Get the failing email from DB
    const { data: alerts } = await supabase
        .from('alerts')
        .select('id, user_id, gmail_id, subject')
        .ilike('subject', '%Security alert%')
        .order('received_at', { ascending: false })
        .limit(1);

    const email = alerts?.[0];

    if (!email) {
        return NextResponse.json({ error: 'Email not found in DB' }, { status: 404 });
    }

    // 2. Fetch raw structure from Gmail API
    try {
        const accessToken = await getValidAccessToken(email.user_id);
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth });

        const response = await gmail.users.messages.get({
            userId: 'me',
            id: email.gmail_id,
            format: 'full',
        });

        // Helper to summarize structure
        const summarizeParts = (parts: any[] = []): any[] => {
            return parts.map(p => ({
                mimeType: p.mimeType,
                bodySize: p.body?.size,
                dataPresent: !!p.body?.data,
                attachmentId: p.body?.attachmentId,
                parts: summarizeParts(p.parts)
            }));
        };

        return NextResponse.json({
            db_info: email,
            gmail_structure: {
                mimeType: response.data.payload?.mimeType,
                parts: summarizeParts(response.data.payload?.parts)
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
