import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database";

type ReactionRow = Database["public"]["Tables"]["event_reactions"]["Row"];
type ReactionInsert = Database["public"]["Tables"]["event_reactions"]["Insert"];

const REACTIONS = new Set(["👍", "❤️", "🎉", "🔥", "👏"] as const);

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
        const body = (await request.json()) as { reaction?: string };
        if (!body.reaction || !REACTIONS.has(body.reaction as never)) {
          return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
        }
        const reaction = body.reaction as ReactionInsert["reaction"];

        // Check if reaction exists
        const { data: existing } = await supabase
            .from("event_reactions")
            .select("id")
            .eq("event_id", id)
            .eq("user_id", user.id)
            .eq("reaction", reaction)
            .single<Pick<ReactionRow, "id">>();

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
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
