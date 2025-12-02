import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database";

type EventUpdatePayload = Partial<
    Pick<
        Database["public"]["Tables"]["events"]["Update"],
        | "title"
        | "description"
        | "start_ts"
        | "end_ts"
        | "location"
        | "capacity"
        | "image_path"
        | "color_block"
        | "tags"
        | "category"
        | "participation_type"
        | "min_team_size"
        | "max_team_size"
    >
>;

export async function PATCH(
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
        const body = (await request.json()) as EventUpdatePayload;
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
            .update({
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
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ event });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to update event";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(
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
        const { error } = await supabase.from("events").delete().eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to delete event";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
