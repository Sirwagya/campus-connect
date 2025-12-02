import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Database } from "@/types/database";

type SpaceRow = Database["public"]["Tables"]["spaces"]["Row"];

export async function GET() {
    try {
        const supabase = await createServerSupabase();
        const { data: spaces, error } = await supabase
            .from("spaces")
            .select("*");

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            count: spaces?.length ?? 0,
            spaces: (spaces ?? []).map((space: SpaceRow) => ({
                name: space.name,
                slug: space.slug,
                id: space.id,
                is_private: space.is_private,
            })),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
