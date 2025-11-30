import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getGmailClient } from '@/lib/gmail';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
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

  const { id, action } = await req.json(); // action: 'star', 'unstar', 'read', 'unread'

  // Get alert to find gmailId
  const { data: alert, error } = await supabaseAdmin
    .from('alerts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  try {
    const gmail = await getGmailClient(userId);
    let addLabelIds: string[] = [];
    let removeLabelIds: string[] = [];
    let updates: any = {};

    if (action === 'star') {
      addLabelIds.push('STARRED');
      updates.starred = true;
    } else if (action === 'unstar') {
      removeLabelIds.push('STARRED');
      updates.starred = false;
    } else if (action === 'read') {
      removeLabelIds.push('UNREAD');
      updates.unread = false;
    } else if (action === 'unread') {
      addLabelIds.push('UNREAD');
      updates.unread = true;
    }

    // Update Gmail
    await gmail.users.messages.modify({
      userId: 'me',
      id: alert.gmail_id,
      requestBody: {
        addLabelIds,
        removeLabelIds,
      },
    });

    // Update Supabase
    await supabaseAdmin
        .from('alerts')
        .update(updates)
        .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update failed', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
