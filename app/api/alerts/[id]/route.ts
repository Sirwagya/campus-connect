import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

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
