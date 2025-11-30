import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        const { slug } = await params;

        // Fetch space details
        const { data: space, error } = await supabase
            .from('spaces')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error || !space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        // Check membership if user is logged in
        let membership = null;
        if (session) {
            const { data: member } = await supabase
                .from('space_members')
                .select('*')
                .eq('space_id', space.id)
                .eq('user_id', session.user.id)
                .single();

            membership = member;
        }

        return NextResponse.json({ space, membership });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        const { slug } = await params;

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updates = await request.json();

        // Check if user is admin or owner
        const { data: space } = await supabase
            .from('spaces')
            .select('id, owner_id')
            .eq('slug', slug)
            .single();

        if (!space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        const { data: user } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        const isOwner = space.owner_id === session.user.id;
        const isAdmin = user?.is_admin;

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: updatedSpace, error } = await supabase
            .from('spaces')
            .update(updates)
            .eq('id', space.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ space: updatedSpace });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        const { slug } = await params;

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin or owner
        const { data: space } = await supabase
            .from('spaces')
            .select('id, owner_id')
            .eq('slug', slug)
            .single();

        if (!space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        const { data: user } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        const isOwner = space.owner_id === session.user.id;
        const isAdmin = user?.is_admin;

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { error } = await supabase
            .from('spaces')
            .delete()
            .eq('id', space.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
