import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getGmailClient } from '@/lib/gmail';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

type AlertRow = Database['public']['Tables']['alerts']['Row'];
type AlertUpdateFields = Pick<AlertRow, 'starred' | 'unread'>;
type UpdateAction = 'star' | 'unstar' | 'read' | 'unread';
type UpdateRequestBody = { id: string; action: UpdateAction };

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value || '';
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  const fallbackUserId = cookieStore.get('auth_user')?.value ?? null;
  const userId = user?.id ?? fallbackUserId;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, action } = (await req.json()) as UpdateRequestBody;

  // Get alert to find gmailId
  const { data: alertData, error } = await supabaseAdmin
    .from('alerts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  const alert = alertData as AlertRow | null;

  if (error || !alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  try {
    const gmail = await getGmailClient(userId);
    const addLabelIds: string[] = [];
    const removeLabelIds: string[] = [];
    const updates: Partial<AlertUpdateFields> = {};

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
    } else {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed';
    console.error('Update failed', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
