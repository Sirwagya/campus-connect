import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/follows/check?targetUserId=xxx - Check if current user follows target
export async function GET(request: Request) {
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

  // Check if current user follows target
  const { data: isFollowing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single();

  // Check if target follows current user
  const { data: isFollowedBy } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', targetUserId)
    .eq('following_id', user.id)
    .single();

  // Get follower/following counts for target
  const { data: profile } = await supabase
    .from('profiles')
    .select('follower_count, following_count')
    .eq('id', targetUserId)
    .single();

  return NextResponse.json({
    isFollowing: !!isFollowing,
    isFollowedBy: !!isFollowedBy,
    followerCount: profile?.follower_count || 0,
    followingCount: profile?.following_count || 0,
  });
}
