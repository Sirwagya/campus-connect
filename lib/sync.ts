import 'server-only';
import { getGmailClient } from '@/lib/gmail';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function syncEmails(userId: string) {
  const gmail = await getGmailClient(userId);

  // 1. List messages from last 30 days
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'newer_than:30d',
    maxResults: 50, // Batch size
  });

  const messages = res.data.messages || [];

  for (const msg of messages) {
    if (!msg.id) continue; // Skip if no message ID
    
    // Check if exists in Supabase
    const { data: existingAlert } = await supabaseAdmin
        .from('alerts')
        .select('id, gmail_id')
        .eq('gmail_id', msg.id)
        .eq('user_id', userId)
        .single();

    if (existingAlert) {
      // Update labels (read/unread/starred)
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'minimal' });
      const labels = detail.data.labelIds || [];
      
      await supabaseAdmin.from('alerts').update({
          labels: labels,
          starred: labels.includes('STARRED'),
          unread: labels.includes('UNREAD'),
      }).eq('id', existingAlert.id);

    } else {
      // Fetch full details and create
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id });
      const payload = detail.data.payload;
      const headers = payload?.headers;
      
      const subject = headers?.find(h => h.name === 'Subject')?.value || '(No Subject)';
      const from = headers?.find(h => h.name === 'From')?.value || 'Unknown';
      const to = headers?.find(h => h.name === 'To')?.value || 'Me';
      const date = headers?.find(h => h.name === 'Date')?.value;
      
      // Simple body extraction (can be improved)
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

      await supabaseAdmin.from('alerts').insert({
        user_id: userId,
        gmail_id: msg.id,
        thread_id: msg.threadId ?? null,
        from_email: from,
        to_email: to,
        subject,
        snippet: detail.data.snippet ?? null,
        body_text: bodyText,
        body_html: bodyHtml,
        labels: detail.data.labelIds || [],
        starred: detail.data.labelIds?.includes('STARRED') ?? false,
        unread: detail.data.labelIds?.includes('UNREAD') ?? true,
        received_at: date ? new Date(date).toISOString() : new Date().toISOString(),
      });
    }
  }

  // Update user lastSync
  await supabaseAdmin.from('users').update({ last_sync: new Date().toISOString() }).eq('id', userId);
}
