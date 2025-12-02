import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Database } from "@/types/database";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationUpdatePayload = {
    id: string;
    is_read: boolean;
};
type NotificationsResponse = { notifications: NotificationRow[] } | { error: string };
type NotificationUpdateResponse = { success: true } | { error: string };

export async function GET() {
    try {
        const supabase = await createServerSupabase();
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json<NotificationsResponse>({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: notifications, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json<NotificationsResponse>({ notifications: notifications ?? [] });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json<NotificationsResponse>({ error: message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json<NotificationUpdateResponse>({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, is_read } = await request.json() as NotificationUpdatePayload;

        const { error } = await supabase
            .from("notifications")
            .update({ read: is_read })
            .eq("id", id)
            .eq("user_id", session.user.id);

        if (error) throw error;

        return NextResponse.json<NotificationUpdateResponse>({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json<NotificationUpdateResponse>({ error: message }, { status: 500 });
    }
}
