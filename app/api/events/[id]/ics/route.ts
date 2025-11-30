import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createServerSupabase();
    const { id } = await params;

    const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Generate ICS content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Campus Connect//Events//EN
BEGIN:VEVENT
UID:${event.id}@campusconnect
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART:${new Date(event.start_ts).toISOString().replace(/[-:]/g, "").split(".")[0]}Z
${event.end_ts ? `DTEND:${new Date(event.end_ts).toISOString().replace(/[-:]/g, "").split(".")[0]}Z` : ""}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ""}
LOCATION:${event.location || ""}
END:VEVENT
END:VCALENDAR`;

    return new NextResponse(icsContent, {
        headers: {
            "Content-Type": "text/calendar",
            "Content-Disposition": `attachment; filename = "${event.title.replace(/[^a-z0-9]/gi, "_")}.ics"`,
        },
    });
}
