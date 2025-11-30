import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createServerSupabase();
    const { id } = await params;
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { reaction } = body;

        // Check if reaction exists
        const { data: existing } = await supabase
            .from("event_reactions")
            .select("id")
            .eq("event_id", id)
            .eq("user_id", user.id)
            .eq("reaction", reaction)
            .single();

        if (existing) {
            // Remove reaction
            await supabase.from("event_reactions").delete().eq("id", existing.id);
            return NextResponse.json({ added: false });
        } else {
            // Add reaction
            await supabase.from("event_reactions").insert({
                event_id: id,
                user_id: user.id,
                reaction,
            });
            return NextResponse.json({ added: true });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
