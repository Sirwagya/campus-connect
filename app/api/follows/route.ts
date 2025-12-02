import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateBody, followActionSchema } from '@/lib/validations';

// GET /api/follows - Get current user's following/followers
export async function GET(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'following'; // 'following' or 'followers'
  const userId = searchParams.get('userId') || user.id;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  if (type === 'followers') {
    // Get users who follow this user
    const { data: followers, error, count } = await supabase
      .from('follows')
      .select(`
        follower_id,
        created_at,
        follower:users!follows_follower_id_fkey(
          id, full_name, avatar_url, email
        ),
        follower_profile:profiles!follows_follower_id_fkey(
          username, display_name, avatar_url, tagline
        )
      `, { count: 'exact' })
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: followers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } else {
    // Get users this user follows
    const { data: following, error, count } = await supabase
      .from('follows')
      .select(`
        following_id,
        created_at,
        following:users!follows_following_id_fkey(
          id, full_name, avatar_url, email
        ),
        following_profile:profiles!follows_following_id_fkey(
          username, display_name, avatar_url, tagline
        )
      `, { count: 'exact' })
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: following,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  }
}

// POST /api/follows - Follow a user
export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const validation = await validateBody(request, followActionSchema);
  if (validation.error || !validation.data) {
    return NextResponse.json({ error: validation.error || 'Invalid data' }, { status: 400 });
  }

  const { targetUserId } = validation.data;

  // Can't follow yourself
  if (targetUserId === user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
  }

  // Check if already following
  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Already following this user' }, { status: 409 });
  }

  // Create follow relationship
  const { data, error } = await supabase
    .from('follows')
    .insert({
      follower_id: user.id,
      following_id: targetUserId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, message: 'Successfully followed user' }, { status: 201 });
}

// DELETE /api/follows - Unfollow a user
export async function DELETE(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('targetUserId');

  if (!targetUserId) {
    return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Successfully unfollowed user' });
}
