import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  // Use proper SSR client to get authenticated user
  const supabase = await createServerSupabase();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  const searchParams = req.nextUrl.searchParams;
  const filter = searchParams.get('filter'); // 'unread', 'starred', 'all'
  const q = searchParams.get('q');

  let query = supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('received_at', { ascending: false })
    .limit(50);

  if (filter === 'unread') {
    query = query.eq('unread', true);
  } else if (filter === 'starred') {
    query = query.eq('starred', true);
  }

  if (q) {
    // Supabase Text Search
    query = query.textSearch('fts', q); // Assuming 'fts' column or similar, or use ilike for simple fields
    // Since we didn't create a generated column 'fts' in the schema, let's use 'ilike' on subject/from for now or 'or'
    // query = query.or(`subject.ilike.%${q}%,from_email.ilike.%${q}%`);
    // But 'or' with other filters is tricky in Supabase-js chain.
    // Let's stick to simple subject search for MVP or if we added the index:
    // create index idx_alerts_search on public.alerts using gin(to_tsvector('english', subject || ' ' || from_email || ' ' || snippet || ' ' || coalesce(body_text, '')));
    // We can use .textSearch if we have a tsvector column. We don't.
    // So let's use .ilike on subject.
    query = query.ilike('subject', `%${q}%`);
  }

  const { data: alerts, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }

  return NextResponse.json({ alerts });
}
