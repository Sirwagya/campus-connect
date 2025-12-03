import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createDraft } from "@/lib/gmail";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { to, subject, body, id } = await req.json();

        // Create or update draft in Gmail
        const result = await createDraft(user.id, { to, subject, body, id });

        // Save to DB as 'draft'
        // Upsert based on gmail_id if possible, or just insert new.
        // Since we don't have the gmail_id for the *new* draft until result comes back.

        // If we have an ID, we might want to update the existing DB record.
        // But Gmail creates a new ID for updates usually (or we just create new).
        // Let's just insert/upsert.

        const { error } = await supabase.from("mails").upsert({
            user_id: user.id,
            gmail_id: result.id,
            thread_id: result.message?.threadId,
            subject: subject,
            body: body,
            from: user.email,
            to: to,
            timestamp: new Date().toISOString(),
            is_read: true,
            is_starred: false,
            category: 'draft',
            labels: ['DRAFT'],
        }, { onConflict: 'gmail_id' });

        if (error) throw error;

        return NextResponse.json({ success: true, id: result.id });
    } catch (error: any) {
        console.error("Draft error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
