import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createServerSupabase();
    const { id } = await params;

    const { data: form, error } = await supabase
        .from("event_forms")
        .select("schema")
        .eq("event_id", id)
        .single();

    if (error && error.code !== "PGRST116") {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ schema: form?.schema || [] });
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createServerSupabase();
    const { id } = await params;
    const { schema } = await request.json();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin
    const { data: userData } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();

    if (!userData?.is_admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
        .from("event_forms")
        .upsert(
            { event_id: id, schema, created_by: user.id },
            { onConflict: "event_id" }
        );

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
