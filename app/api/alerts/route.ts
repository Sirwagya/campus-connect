import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const searchParams = req.nextUrl.searchParams;
    
    const filter = searchParams.get('filter');
    const q = searchParams.get('q');
    const limitParam = parseInt(searchParams.get('limit') || '50');
    const limit = Math.min(Math.max(limitParam, 1), 100); // Cap between 1-100

    let query = supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .order('received_at', { ascending: false })
      .limit(limit);

    if (filter === 'unread') {
      query = query.eq('unread', true);
    } else if (filter === 'starred') {
      query = query.eq('starred', true);
    }

    if (q && q.length >= 2 && q.length <= 100) {
      // Sanitize search query
      const sanitizedQuery = q.replace(/[%_]/g, '');
      query = query.ilike('subject', `%${sanitizedQuery}%`);
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error('[Alerts API] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }

    return NextResponse.json({ alerts: alerts || [] });
  } catch (error) {
    console.error('[Alerts API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
