import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import type { Database } from '@/types/database';

type SpaceInsert = Database['public']['Tables']['spaces']['Insert'];

const buildErrorResponse = (error: unknown, status = 500) => {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status });
};

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const tag = searchParams.get('tag');
        const limit = Number.parseInt(searchParams.get('limit') || '20', 10);

        let dbQuery = supabase
            .from('spaces')
            .select('*')
            .order('member_count', { ascending: false }) // Popular first
            .limit(limit);

        if (query) {
            dbQuery = dbQuery.ilike('name', `%${query}%`);
        }

        if (tag) {
            dbQuery = dbQuery.contains('tags', [tag]);
        }

        const { data: spaces, error } = await dbQuery;

        if (error) {
            return buildErrorResponse(error);
        }

        return NextResponse.json({ spaces });
    } catch (error: unknown) {
        return buildErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await request.json()) as Partial<SpaceInsert> & { isPrivate?: boolean };
        const { name, slug, description, isPrivate, tags } = body;

        console.log("Creating space:", { name, slug, owner_id: session.user.id });

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
        }

        // 1. Create Space
        const { data: space, error: spaceError } = await supabase
            .from('spaces')
            .insert({
                name,
                slug,
                description,
                is_private: isPrivate || false,
                owner_id: session.user.id,
                tags: tags || [],
                member_count: 1
            })
            .select()
            .single();

        if (spaceError) {
            console.error("Error inserting space:", spaceError);
            if (spaceError.code === '23505') { // Unique violation
                return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
            }
            return NextResponse.json({ error: spaceError.message }, { status: 500 });
        }

        // 2. Add Owner as Member
        // Note: RLS might block this if we don't use service role, but let's try standard client first.
        // Actually, the policy "Users can join public spaces" might not cover private spaces or owner auto-join.
        // We should use a trigger or just do it here. 
        // Since we just created the space, we are the owner.
        // Let's use the same client. If it fails, we might need to adjust RLS or use admin.

        const { error: memberError } = await supabase
            .from('space_members')
            .insert({
                space_id: space.id,
                user_id: session.user.id,
                role: 'owner'
            });

        if (memberError) {
            console.error('Error adding owner to space:', memberError);
            // We might want to delete the space if this fails, but for now just report error
            return NextResponse.json({ error: 'Space created but failed to join owner' }, { status: 500 });
        }

        return NextResponse.json({ space });
    } catch (error: unknown) {
        return buildErrorResponse(error);
    }
}
