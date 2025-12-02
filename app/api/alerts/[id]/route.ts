import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { toggleStar } from '@/lib/gmail';
import type { Database } from '@/types/database';

type AlertRow = Database['public']['Tables']['alerts']['Row'];
type AlertUpdatePayload = Pick<AlertRow, 'starred' | 'unread'>;
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  // Use proper SSR client to get authenticated user
  const supabase = await createServerSupabase();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const userId = user.id;

  const { data: alert, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .returns<AlertRow>()
    .single();

  if (error || !alert) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ alert });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const supabase = await createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as Partial<AlertUpdatePayload>;

  const updates: Partial<AlertUpdatePayload> = {};
  if (typeof body.starred === 'boolean') updates.starred = body.starred;
  if (typeof body.unread === 'boolean') updates.unread = body.unread;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Get alert to get gmail_id
  const { data: alertData } = await supabase
    .from('alerts')
    .select('gmail_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  const alert = alertData as Pick<AlertRow, 'gmail_id'> | null;

  if (!alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('alerts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sync with Gmail
  if (updates.starred !== undefined && updates.starred !== null) {
    try {
      await toggleStar(user.id, alert.gmail_id, updates.starred);
    } catch (gmailError) {
      console.error('Failed to sync star with Gmail:', gmailError);
      // We don't fail the request if Gmail sync fails, but we log it
    }
  }

  return NextResponse.json({ success: true });
}
