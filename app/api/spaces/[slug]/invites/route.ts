import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

// Simple random string generator to avoid external deps if possible, 
// but if we use nanoid we need to ensure it's installed.
// Let's use a simple custom one for now to be safe and fast.
function generateCode(length: number = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Space ID
    const { data: space } = await supabase
      .from('spaces')
      .select('id, owner_id, is_private')
      .eq('slug', slug)
      .single();

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    if (!space.is_private) {
      return NextResponse.json({ error: 'Invites are only available for private spaces' }, { status: 400 });
    }

    // Check membership role (Owner/Moderator only)
    const { data: membership } = await supabase
      .from('space_members')
      .select('role')
      .eq('space_id', space.id)
      .eq('user_id', session.user.id)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'moderator')) {
      return NextResponse.json({ error: 'Forbidden: Only owners and moderators can create invites' }, { status: 403 });
    }

    const body = await request.json();
    const { maxUses, expiresInDays } = body;

    const code = generateCode(10);
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: invite, error } = await supabase
      .from('space_invites')
      .insert({
        space_id: space.id,
        code,
        created_by: session.user.id,
        max_uses: maxUses || null,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invite });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Space ID
    const { data: space } = await supabase
      .from('spaces')
      .select('id, is_private')
      .eq('slug', slug)
      .single();

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    if (!space.is_private) {
      return NextResponse.json({ error: 'Invites are only available for private spaces' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('space_members')
      .select('role')
      .eq('space_id', space.id)
      .eq('user_id', session.user.id)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'moderator')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: invites, error } = await supabase
      .from('space_invites')
      .select('*')
      .eq('space_id', space.id)
      .gt('expires_at', new Date().toISOString()) // Only active
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ invites });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
