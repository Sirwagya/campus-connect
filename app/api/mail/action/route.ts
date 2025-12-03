import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { toggleStar, markAsRead, trashMessage, deleteMessage } from "@/lib/gmail";

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

        const { id, action, value } = await req.json();
        // id: local DB id or gmail_id? Let's assume we pass the DB ID, but we need gmail_id for API calls.
        // Let's fetch the mail first to get gmail_id.

        const { data: mail } = await supabase
            .from("mails")
            .select("gmail_id")
            .eq("id", id)
            .single();

        if (!mail || !mail.gmail_id) {
            return NextResponse.json({ error: "Mail not found" }, { status: 404 });
        }

        const gmailId = mail.gmail_id;

        switch (action) {
            case "star":
                await toggleStar(user.id, gmailId, value); // value = true/false
                await supabase.from("mails").update({ is_starred: value }).eq("id", id);
                break;
            case "read":
                if (value) {
                    await markAsRead(user.id, gmailId);
                    await supabase.from("mails").update({ is_read: true }).eq("id", id);
                }
                break;
            case "trash":
                await trashMessage(user.id, gmailId);
                await supabase.from("mails").update({ category: 'trash' }).eq("id", id);
                break;
            case "delete":
                await deleteMessage(user.id, gmailId);
                await supabase.from("mails").delete().eq("id", id);
                break;
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Action error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
