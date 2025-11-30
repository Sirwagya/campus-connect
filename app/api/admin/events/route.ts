import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createServerSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();

    if (!userData?.is_admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const {
            title,
            description,
            start_ts,
            end_ts,
            location,
            capacity,
            image_path,
            color_block,
            tags,
            category,
            participation_type,
            min_team_size,
            max_team_size,
        } = body;

        const { data: event, error } = await supabase
            .from("events")
            .insert({
                title,
                description,
                start_ts,
                end_ts,
                location,
                capacity,
                image_path,
                color_block,
                tags,
                category,
                participation_type,
                min_team_size,
                max_team_size,
                created_by: user.id,
                approved: true, // Admins auto-approve
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ event });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
