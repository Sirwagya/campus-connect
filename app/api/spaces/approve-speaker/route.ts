import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { spaceId, userId, action } = body; // action: 'approve' | 'deny'

        if (!spaceId || !userId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify requester is host/cohost
        // We can do this via RLS if we trust the client to handle the error, 
        // but for API robustness we check here or rely on the update policy.
        // The RLS policy "Hosts can update requests" handles this check.

        if (action === 'approve') {
            // 1. Update request status
            const { error: requestError } = await supabase
                .from('speaker_requests')
                .update({ status: 'approved' })
                .eq('space_id', spaceId)
                .eq('user_id', userId);

            if (requestError) {
                return NextResponse.json({ error: requestError.message }, { status: 500 });
            }

            // 2. Update participant role to 'speaker'
            // Use supabaseAdmin to ensure this works regardless of specific RLS nuances for role updates
            const { error: participantError } = await supabaseAdmin
                .from('space_participants')
                .update({ role: 'speaker' })
                .eq('space_id', spaceId)
                .eq('user_id', userId);

            if (participantError) {
                return NextResponse.json({ error: participantError.message }, { status: 500 });
            }

        } else if (action === 'deny') {
            const { error } = await supabase
                .from('speaker_requests')
                .update({ status: 'denied' })
                .eq('space_id', spaceId)
                .eq('user_id', userId);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Approve Speaker] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
