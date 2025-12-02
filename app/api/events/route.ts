import { createServerSupabase } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { searchParams } = new URL(request.url);

        const category = searchParams.get("category");
        const tag = searchParams.get("tag");
        const search = searchParams.get("search");
        
        // Validate and cap pagination parameters
        const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 100);
        const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

        let query = supabase
            .from("events")
            .select("*")
            .eq("approved", true)
            .order("start_ts", { ascending: true });

        if (category && category.length <= 50) {
            query = query.eq("category", category);
        }

        if (tag && tag.length <= 50) {
            query = query.contains("tags", [tag]);
        }

        if (search && search.length <= 100) {
            // Sanitize search input
            const sanitizedSearch = search.replace(/[%_]/g, '');
            query = query.ilike("title", `%${sanitizedSearch}%`);
        }

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data: events, error, count } = await query;

        if (error) {
            console.error('[Events API] Error:', error);
            return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
        }

        return NextResponse.json({ 
            events: events || [],
            pagination: {
                limit,
                offset,
                hasMore: (events?.length || 0) === limit
            }
        });
    } catch (error) {
        console.error('[Events API] Unexpected error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
