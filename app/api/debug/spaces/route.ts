import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET() {
    try {
        const supabase = await createServerSupabase();
        const { data: spaces, error } = await supabase
            .from('spaces')
            .select('*');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            count: spaces.length,
            spaces: spaces.map(s => ({ name: s.name, slug: s.slug, id: s.id, is_private: s.is_private }))
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
