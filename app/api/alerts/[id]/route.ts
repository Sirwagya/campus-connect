import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { toggleStar } from '@/lib/gmail';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    .single();

  if (error || !alert) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ alert });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Only allow updating specific fields
  const updates: any = {};
  if (typeof body.starred === 'boolean') updates.starred = body.starred;
  if (typeof body.unread === 'boolean') updates.unread = body.unread;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Get alert to get gmail_id
  const { data: alert } = await supabase
    .from('alerts')
    .select('gmail_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

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
  if (updates.starred !== undefined) {
    try {
      await toggleStar(user.id, alert.gmail_id, updates.starred);
    } catch (gmailError) {
      console.error('Failed to sync star with Gmail:', gmailError);
      // We don't fail the request if Gmail sync fails, but we log it
    }
  }

  return NextResponse.json({ success: true });
}
