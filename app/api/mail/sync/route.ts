import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { listMessages, getMessage, extractBody, parseHeaders } from "@/lib/gmail";
import { MailCategory } from "@/types/mail";

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

        // 1. Fetch recent messages from Gmail (Inbox)
        const messages = await listMessages(user.id, 20); // Fetch last 20
        let syncCount = 0;

        for (const msg of messages) {
            // Check if already exists
            const { data: existing } = await supabase
                .from("mails")
                .select("id")
                .eq("gmail_id", msg.id!)
                .single();

            if (existing) continue;

            // 2. Fetch full details
            const fullMsg = await getMessage(user.id, msg.id!);
            const headers = parseHeaders(fullMsg.payload?.headers || []);
            const { text, html } = extractBody(fullMsg.payload || {});

            // Determine category and labels
            const labelIds = fullMsg.labelIds || [];
            let category: MailCategory = 'inbox';

            if (labelIds.includes('SENT')) category = 'sent';
            else if (labelIds.includes('DRAFT')) category = 'draft';
            else if (labelIds.includes('SPAM')) category = 'spam';
            else if (labelIds.includes('TRASH')) category = 'trash';

            const isStarred = labelIds.includes('STARRED');
            const isRead = !labelIds.includes('UNREAD');

            // 3. Insert into DB
            const { error } = await supabase.from("mails").insert({
                user_id: user.id,
                gmail_id: msg.id,
                thread_id: msg.threadId,
                subject: headers.subject,
                body: text.slice(0, 200), // Store snippet for list view, or full body if needed. Let's store snippet for now to save space, or full body? 
                // The schema has 'body' text. Let's store the text version.
                // Ideally we should store both or fetch on demand. For a simple clone, storing text body is good.
                // Let's store the full text body.
                from: headers.from,
                to: headers.to,
                timestamp: new Date(parseInt(fullMsg.internalDate || Date.now().toString())).toISOString(),
                is_read: isRead,
                is_starred: isStarred,
                category: category,
                labels: labelIds,
            });

            if (!error) syncCount++;
        }

        return NextResponse.json({ success: true, synced: syncCount });
    } catch (error: any) {
        console.error("Sync error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
