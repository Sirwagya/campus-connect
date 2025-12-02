import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateBody, reactionSchema } from '@/lib/validations';

// GET /api/reactions - Get reactions for a post or comment
export async function GET(request: Request) {
  const supabase = await createClient();
  
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('targetType');
  const targetId = searchParams.get('targetId');

  if (!targetType || !targetId) {
    return NextResponse.json({ error: 'targetType and targetId are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('reactions')
    .select(`
      *,
      user:users(id, full_name, avatar_url),
      profile:profiles(username, display_name, avatar_url)
    `)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by emoji
  const grouped = (data || []).reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof data>);

  return NextResponse.json({
    data,
    grouped,
    total: data?.length || 0,
  });
}

// POST /api/reactions - Add a reaction
export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const validation = await validateBody(request, reactionSchema);
  if (validation.error || !validation.data) {
    return NextResponse.json({ error: validation.error || 'Invalid data' }, { status: 400 });
  }

  const { target_type, target_id, emoji } = validation.data;

  // Check if user already reacted
  const { data: existing } = await supabase
    .from('reactions')
    .select('id, emoji')
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    if (existing.emoji === emoji) {
      // Same reaction - remove it (toggle off)
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existing.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ message: 'Reaction removed', action: 'removed' });
    } else {
      // Different reaction - update it
      const { data, error } = await supabase
        .from('reactions')
        .update({ emoji })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data, action: 'updated' });
    }
  }

  // Create new reaction
  const { data, error } = await supabase
    .from('reactions')
    .insert({
      target_type,
      target_id,
      user_id: user.id,
      emoji,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, action: 'added' }, { status: 201 });
}

// DELETE /api/reactions - Remove a reaction
export async function DELETE(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('targetType');
  const targetId = searchParams.get('targetId');

  if (!targetType || !targetId) {
    return NextResponse.json({ error: 'targetType and targetId are required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Reaction removed' });
}
