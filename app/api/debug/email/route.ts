import { supabaseAdmin } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";
import { getValidAccessToken } from "@/lib/gmail-tokens";

type MessagePartSummary = {
    mimeType?: string | null;
    bodySize?: number | null;
    dataPresent: boolean;
    attachmentId?: string | null;
    parts: MessagePartSummary[];
};

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
        const summarizeParts = (
            parts: gmail_v1.Schema$MessagePart[] = []
        ): MessagePartSummary[] =>
            parts.map(part => ({
                mimeType: part.mimeType,
                bodySize: part.body?.size ?? null,
                dataPresent: Boolean(part.body?.data),
                attachmentId: part.body?.attachmentId ?? null,
                parts: summarizeParts(part.parts ?? []),
            }));

        return NextResponse.json({
            db_info: email,
            gmail_structure: {
                mimeType: response.data.payload?.mimeType,
                parts: summarizeParts(response.data.payload?.parts)
            }
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const stack = error instanceof Error ? error.stack : undefined;
        return NextResponse.json({ error: message, stack }, { status: 500 });
    }
}
