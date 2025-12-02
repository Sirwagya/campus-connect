import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase-server";
import { sanitizePostContent } from "@/lib/feed/sanitizer";
import type { FeedAttachment } from "@/types/feed";
import type { Database } from "@/types/database";

type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type CreatePostPayload = {
    content?: string;
    attachments?: FeedAttachment[];
    reply_to?: string | null;
};
type CreatePostResponse =
    | { error: string; details?: unknown; stack?: string; post?: undefined }
    | { post: PostRow; error?: undefined };

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await request.json()) as Partial<CreatePostPayload>;
        const attachments = Array.isArray(body.attachments) ? body.attachments : [];
        const content = body.content ?? "";
        const { reply_to } = body;

        if (!content && attachments.length === 0) {
            return NextResponse.json({ error: 'Content or attachments required' }, { status: 400 });
        }

        // Rate limiting check (simple: max 5 posts in last minute)
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
            .from("posts")
            .select("*", { count: "exact", head: true })
            .eq("user_id", session.user.id)
            .gt("created_at", oneMinuteAgo);

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
            .from("posts")
            .insert({
                user_id: session.user.id,
                body: sanitizedContent,
                attachments: attachments as unknown as Database['public']['Tables']['posts']['Insert']['attachments'],
                reply_to: reply_to ?? null,
            })
            .select()
            .single();

        if (error) {
            console.error('[Feed Create] DB Error:', error);
            return NextResponse.json({ error: 'Database Error: ' + error.message, details: error }, { status: 500 });
        }

        const postData = data as unknown as PostRow;
        console.log('[Feed Create] Success:', postData.id);
        return NextResponse.json<CreatePostResponse>({ post: postData });
    } catch (error: unknown) {
        console.error('[Feed Create] Unexpected error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        const stack = error instanceof Error ? error.stack : undefined;
        return NextResponse.json<CreatePostResponse>({
            error: 'Unexpected Error: ' + message,
            stack,
        }, { status: 500 });
    }
}
