import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateBody, updatePresenceSchema } from '@/lib/validations';

// GET /api/presence - Get online users or specific user's presence
export async function GET(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const userIds = searchParams.get('userIds'); // comma-separated

  if (userId) {
    // Get single user's presence
    const { data, error } = await supabase
      .from('presence')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || { user_id: userId, status: 'offline', last_seen: null },
    });
  }

  if (userIds) {
    // Get multiple users' presence
    const ids = userIds.split(',').filter(Boolean);
    const { data, error } = await supabase
      .from('presence')
      .select('*')
      .in('user_id', ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fill in offline status for users not in presence table
    const presenceMap = new Map(data?.map(p => [p.user_id, p]) || []);
    const result = ids.map(id => presenceMap.get(id) || { user_id: id, status: 'offline', last_seen: null });

    return NextResponse.json({ data: result });
  }

  // Get all online users (for general presence display)
  const { data, error } = await supabase
    .from('presence')
    .select(`
      *,
      user:users(id, full_name, avatar_url),
      profile:profiles(username, display_name, avatar_url)
    `)
    .neq('status', 'offline')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/presence - Update current user's presence
export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const validation = await validateBody(request, updatePresenceSchema);
  if (validation.error || !validation.data) {
    return NextResponse.json({ error: validation.error || 'Invalid data' }, { status: 400 });
  }

  const { status, custom_status } = validation.data;

  // Upsert presence
  const { data, error } = await supabase
    .from('presence')
    .upsert({
      user_id: user.id,
      status,
      custom_status,
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also update users.last_seen
  await supabase
    .from('users')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', user.id);

  return NextResponse.json({ data });
}

// DELETE /api/presence - Set user offline (on logout/disconnect)
export async function DELETE() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('presence')
    .update({
      status: 'offline',
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Set to offline' });
}
