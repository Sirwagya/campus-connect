import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendMessage } from "@/lib/gmail";

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

        const { to, subject, body, cc, bcc } = await req.json();

        if (!to || !subject || !body) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Send via Gmail API
        const result = await sendMessage(user.id, { to, subject, body, cc, bcc });

        // 2. Save to DB as 'sent'
        // Note: Gmail API 'send' automatically saves to Sent folder in Gmail, 
        // so the next sync would pick it up. 
        // But for immediate UI feedback, we can insert it now.
        // However, the 'result' from sendMessage contains the new message ID.

        await supabase.from("mails").insert({
            user_id: user.id,
            gmail_id: result.id,
            thread_id: result.threadId,
            subject: subject,
            body: body, // Storing the sent body
            from: user.email, // Assuming user sent it
            to: to,
            timestamp: new Date().toISOString(),
            is_read: true,
            is_starred: false,
            category: 'sent',
            labels: ['SENT'],
        });

        return NextResponse.json({ success: true, id: result.id });
    } catch (error: any) {
        console.error("Send error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
