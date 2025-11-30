import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
        .from("events")
        .select("*")
        .eq("approved", true)
        .order("start_ts", { ascending: true });

    if (category) {
        query = query.eq("category", category);
    }

    if (tag) {
        query = query.contains("tags", [tag]);
    }

    if (search) {
        query = query.ilike("title", `%${search}%`);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: events, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events });
}
