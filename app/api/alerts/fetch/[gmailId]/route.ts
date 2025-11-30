import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getGmailClient } from '@/lib/gmail';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ gmailId: string }> }) {
  const cookieStore = await cookies();
  // Try to get user from Supabase Auth cookie or fallback
  const { data: { user } } = await supabaseAdmin.auth.getUser(cookieStore.get('sb-access-token')?.value || '');
  let userId = user?.id;

  if (!userId) {
      userId = cookieStore.get('auth_user')?.value;
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { gmailId } = await params;

  try {
    const gmail = await getGmailClient(userId);
    
    // Fetch full details from Gmail
    const detail = await gmail.users.messages.get({ userId: 'me', id: gmailId });
    const payload = detail.data.payload;
    const headers = payload?.headers;
    
    const subject = headers?.find(h => h.name === 'Subject')?.value || '(No Subject)';
    const from = headers?.find(h => h.name === 'From')?.value || 'Unknown';
    const to = headers?.find(h => h.name === 'To')?.value || 'Me';
    const date = headers?.find(h => h.name === 'Date')?.value;
    
    let bodyText = detail.data.snippet || '';
    let bodyHtml = '';
    
    if (payload?.body?.data) {
        bodyText = Buffer.from(payload.body.data, 'base64').toString();
    } else if (payload?.parts) {
        const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
        const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
        if (textPart?.body?.data) bodyText = Buffer.from(textPart.body.data, 'base64').toString();
        if (htmlPart?.body?.data) bodyHtml = Buffer.from(htmlPart.body.data, 'base64').toString();
    }

    // Upsert into Supabase
    const { data: alert, error } = await supabaseAdmin.from('alerts').upsert({
      user_id: userId,
      gmail_id: gmailId,
      thread_id: detail.data.threadId,
      from_email: from,
      to_email: to,
      subject,
      snippet: detail.data.snippet,
      body_text: bodyText,
      body_html: bodyHtml,
      labels: detail.data.labelIds || [],
      starred: detail.data.labelIds?.includes('STARRED'),
      unread: detail.data.labelIds?.includes('UNREAD'),
      received_at: date ? new Date(date).toISOString() : new Date().toISOString(),
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'user_id, gmail_id' }).select().single();

    if (error) {
        console.error("Upsert failed", error);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    return NextResponse.json({ alert });

  } catch (error) {
    console.error('Fetch failed', error);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
