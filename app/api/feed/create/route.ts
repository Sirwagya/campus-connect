import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, supabaseAdmin } from '@/lib/supabase-server';
import { sanitizePostContent } from '@/lib/feed/sanitizer';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { content, attachments = [], reply_to } = body;

        if (!content && (!attachments || attachments.length === 0)) {
            return NextResponse.json({ error: 'Content or attachments required' }, { status: 400 });
        }

        // Rate limiting check (simple: max 5 posts in last minute)
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .gt('created_at', oneMinuteAgo);

        if (count !== null && count >= 5) {
            return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment.' }, { status: 429 });
        }

        // Sanitize content
        console.log('[Feed Create] Sanitizing content...');
        const sanitizedContent = sanitizePostContent(content || '');
        console.log('[Feed Create] Content sanitized.');

        // Insert post
        // Use supabaseAdmin to bypass potential RLS/Schema Cache issues with the anon client
        console.log('[Feed Create] Inserting into DB with Admin...');
        const { data, error } = await supabaseAdmin
            .from('posts')
            .insert({
                user_id: session.user.id,
                content: sanitizedContent,
                attachments,
                reply_to,
            })
            .select()
            .single();

        if (error) {
            console.error('[Feed Create] DB Error:', error);
            return NextResponse.json({ error: 'Database Error: ' + error.message, details: error }, { status: 500 });
        }

        console.log('[Feed Create] Success:', data.id);
        return NextResponse.json({ post: data });
    } catch (error: any) {
        console.error('[Feed Create] Unexpected error:', error);
        return NextResponse.json({ error: 'Unexpected Error: ' + error.message, stack: error.stack }, { status: 500 });
    }
}
