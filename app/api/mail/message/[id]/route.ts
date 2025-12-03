import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createServerSupabase();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const { data: mail, error } = await supabase
            .from("mails")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

        if (error) throw error;

        return NextResponse.json({ mail });
    } catch (error: any) {
        console.error("Fetch mail error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
