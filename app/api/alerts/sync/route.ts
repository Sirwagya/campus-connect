import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, supabaseAdmin } from '@/lib/supabase-server';
import { listMessages, getMessage, parseHeaders, extractBody } from '@/lib/gmail';

export async function POST(request: NextRequest) {
  console.log('=== GMAIL SYNC STARTED ===');

  try {
    // Get authenticated user
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    console.log('[Sync] User:', userEmail);
    console.log('[Sync] User ID:', userId);

    // Get user's last sync time
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('last_sync')
      .eq('id', userId)
      .single();

    const lastSync = userRecord?.last_sync;
    let query = '';

    if (lastSync) {
      const lastSyncDate = new Date(lastSync);
      const seconds = Math.floor(lastSyncDate.getTime() / 1000);
      query = `after:${seconds}`;
      console.log(`[Sync] Incremental sync: fetching emails after ${lastSyncDate.toISOString()} (query: "${query}")`);
    } else {
      console.log('[Sync] Full sync: fetching recent emails');
    }

    // Fetch recent emails from Gmail
    console.log('[Sync] Fetching messages from Gmail...');

    let messages;
    try {
      // If incremental, fetch up to 50 new emails. If full, fetch 20.
      messages = await listMessages(userId, 50, query);
      console.log(`[Sync] ✅ Found ${messages.length} messages`);
    } catch (error: any) {
      console.error('[Sync] ❌ Failed to fetch from Gmail:', error.message);
      return NextResponse.json({
        error: 'Gmail API Error: ' + error.message,
        details: error.toString()
      }, { status: 500 });
    }

    let newCount = 0;
    let updatedCount = 0;

    // Process each message
    for (const message of messages) {
      if (!message.id) continue;

      try {
        // Get full message details
        const fullMessage = await getMessage(userId, message.id);

        if (!fullMessage.payload) continue;

        const headers = parseHeaders(fullMessage.payload.headers || []);
        const body = extractBody(fullMessage.payload);
        const snippet = fullMessage.snippet || '';
        const isUnread = fullMessage.labelIds?.includes('UNREAD') || false;
        const isStarred = fullMessage.labelIds?.includes('STARRED') || false;

        // Check if message already exists
        const { data: existing } = await supabaseAdmin
          .from('alerts')
          .select('id')
          .eq('gmail_id', message.id)
          .single();

        if (existing) {
          // Update existing
          await supabaseAdmin
            .from('alerts')
            .update({
              unread: isUnread,
              starred: isStarred,
              body_html: body.html,
              body_text: body.text,
              snippet: snippet,
              subject: headers.subject,
              from_email: headers.from,
              to_email: headers.to,
            })
            .eq('gmail_id', message.id);

          updatedCount++;
        } else {
          // Insert new
          await supabaseAdmin
            .from('alerts')
            .insert({
              user_id: userId,
              gmail_id: message.id,
              subject: headers.subject,
              from_email: headers.from,
              to_email: headers.to,
              snippet,
              body_text: body.text,
              body_html: body.html,
              received_at: new Date(headers.date).toISOString(),
              unread: isUnread,
              starred: isStarred,
            });

          newCount++;
        }
      } catch (error) {
        console.error(`[Sync] Error processing message ${message.id}:`, error);
        // Continue with next message
      }
    }

    // Update last sync time
    await supabaseAdmin
      .from('users')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', userId);

    console.log('[Sync] ✅ Complete');
    console.log(`[Sync] New: ${newCount}, Updated: ${updatedCount}`);

    return NextResponse.json({
      success: true,
      newCount,
      updatedCount,
      totalProcessed: messages.length,
    });

  } catch (error: any) {
    console.error('[Sync] ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

// Allow GET for manual trigger
export async function GET(request: NextRequest) {
  return POST(request);
}
