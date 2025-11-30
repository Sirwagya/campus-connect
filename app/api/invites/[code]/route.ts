import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, supabaseAdmin } from '@/lib/supabase-server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    try {
        const supabase = await createServerSupabase();
        // No auth required to view invite details (public page)

        const { data: invite } = await supabase
            .from('space_invites')
            .select('*, space:spaces(id, name, description, member_count, is_private)')
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (!invite) {
            return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
        }

        if (invite.max_uses && invite.uses >= invite.max_uses) {
            return NextResponse.json({ error: 'Invite limit reached' }, { status: 410 });
        }

        return NextResponse.json({ invite });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Validate Invite
        const { data: invite } = await supabase
            .from('space_invites')
            .select('*, space:spaces(id, slug)')
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (!invite) {
            return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
        }

        if (invite.max_uses && invite.uses >= invite.max_uses) {
            return NextResponse.json({ error: 'Invite limit reached' }, { status: 410 });
        }

        // 2. Check if already a member
        const { data: existingMember } = await supabase
            .from('space_members')
            .select('id')
            .eq('space_id', invite.space_id)
            .eq('user_id', session.user.id)
            .single();

        if (existingMember) {
            return NextResponse.json({ spaceSlug: invite.space.slug, message: 'Already a member' });
        }

        // 3. Add Member using Admin Client (Bypass RLS)
        const { error: joinError } = await supabaseAdmin
            .from('space_members')
            .insert({
                space_id: invite.space_id,
                user_id: session.user.id,
                role: 'member'
            });

        if (joinError) {
            return NextResponse.json({ error: joinError.message }, { status: 500 });
        }

        // 4. Increment uses (RPC or direct update if admin)
        // Let's use direct update since we have admin
        await supabaseAdmin
            .from('space_invites')
            .update({ uses: invite.uses + 1 })
            .eq('id', invite.id);

        // 5. Increment space member count
        await supabase.rpc('increment_space_member_count', { space_id: invite.space_id });

        return NextResponse.json({ spaceSlug: invite.space.slug });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
